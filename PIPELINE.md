# TooToo Release Pipeline — Specification

**Status:** draft · **Created:** 2026-06-21 · **Owner:** Theo

This document specifies the three chat commands that move a TooToo change from
the dev sandbox out to every published copy:

```
edit in dev  →  promote  →  sync  →  publish
                (to prod)   (to forks)  (to the web)
```

You type a single word in chat. Claude performs the whole stage and reports back.

---

## 1. Core model

- **Dev is the source of truth.** All changes are made in
  `pushme-pullyou-tootoo/tootoo-dev/index.html`, tested locally via `file://`,
  and only then promoted. Production is a generated artifact, never hand-edited.
- **`index.html` is identical across every repo.** The only differences are the
  three identity lines in the *Dev* copy (`appName`, `<title>`, `revised`), which
  `promote` strips on the way to production.
- **Per-fork customization lives in `tootoo.config.js`,** not in `index.html`.
  Every downstream repo has its own `tootoo.config.js` carrying its branding
  (owner/repo, appName, theme, etc.). **No pipeline command ever touches
  `tootoo.config.js`.** This is what makes `sync` a safe plain copy.

### The three roles

| Role | File | Identity (`appName`) | Edited by |
| --- | --- | --- | --- |
| **Dev** | `tootoo-dev/index.html` | `TooToo Dev` | You (by hand) |
| **Production** | `index.html` (this repo) | `TooToo` | `promote` only |
| **Downstream** | `<repo>/index.html` (×N) | `TooToo` | `sync` only |

---

## 2. `promote` — dev → production

Copies the tested dev build into this repo's production `index.html`.

**Preconditions**
- `tootoo-dev/index.html` exists and is the build you want to ship.

**Steps**
1. Stamp current Pacific time → `TS` (`YYYY-MM-DD HH:MM`) and `TSF` (`YYYY-MM-DD-HH-MM`).
2. **Back up** current production: copy `index.html` → `.archive/index-<TSF>.html`.
3. **Copy** `tootoo-dev/index.html` → `index.html` (overwrite).
4. **Revert dev identity** in the new `index.html`:
   - `appName: 'TooToo Dev'` → `appName: 'TooToo'`
   - `<title>TooToo Dev</title>` → `<title>TooToo</title>`
   - `<meta name="revised" content="...">` → `TS`
5. **Write a changelog entry** (decision: option C — auto-authored). Prepend a
   dated bullet to the `## Change Log` section of `README.md`, newest on top.
   Wording is derived from the dev README journal and the `git diff` of the
   change. Date heading format `YYYY-MM-DD`.
6. **Report**: the backup path created, and a `git diff --stat` of production.

**Does NOT**: commit, push, or touch `tootoo.config.js`. Git stays manual.

**Result**: production `index.html` == dev `index.html`, except the three
identity lines. The diff is always small and reviewable.

---

## 3. `sync` — production → all downstream copies

Fans the freshly promoted production `index.html` out to every vendored copy.

**Preconditions**
- A `promote` has run (production is current).
- Confirmation prompt before writing (this touches many repos).

**Steps**
1. For each repo in the **target set** (§5):
   a. **Pre-flight**: confirm the target's working tree is clean *for
      `index.html`* (no uncommitted local edits to overwrite). Skip + report any
      dirty target rather than clobbering it.
   b. **Copy** canonical `index.html` → `<repo>/index.html`.
   c. Leave `<repo>/tootoo.config.js` untouched.
2. **Report** a table: each target, updated / skipped (clean vs dirty) / identical.

**Safety model**: each target is its own git repo, so git history is the backup
(no `.archive` copies needed downstream). The pre-flight clean check guarantees
`sync` never destroys unsaved work.

**Does NOT**: commit, push, or modify any `tootoo.config.js`.

---

## 4. `publish` — push everything to the web

Commits and pushes every repo changed by `promote`/`sync` so each GitHub Pages
site rebuilds. **This is the only command that performs git pushes.**

> ⚠️ **Exception to the standing "don't commit or push" rule.** This command
> exists *because* you explicitly asked for it. It still requires an explicit
> confirmation each run, and reports per-repo status. It never uses `--force`
> and never bypasses hooks.

**Preconditions**
- **Commit message is derived from the changelog** — the dated entry `promote`
  wrote to `README.md` is the commit message, shared across all repos in the run.
- Explicit "yes, publish N repos" confirmation listing the affected repos.

**Eligibility**: `publish` acts only on targets that are git repos. Non-repo
targets (e.g. the root launcher folder) are sync-only and auto-skipped here — no
special-casing needed.

**Steps**
1. Determine the affected set: canonical (from `promote`) + every git-repo target
   updated by `sync`.
2. For each repo, in order:
   a. `git add index.html` (+ `README.md` for the canonical repo).
   b. `git commit -m "<message>"`.
   c. `git push` to its default branch.
3. **Report** a table: repo, commit SHA, push result (ok / failed / nothing to
   commit). Continue past a failed repo; never abort the batch silently.

**Does NOT**: force-push, rebase, push `tootoo.config.js` changes you didn't
make, or publish repos with merge conflicts (those are reported and skipped).

GitHub Pages redeploys automatically on push, so "live" follows from the push.

---

## 5. Target set (downstream copies)

Discovered 2026-06-21 by scanning for TooToo builds (`TOOTOO_CONFIG` /
`appName: 'TooToo'`) that are **not** the canonical repo. All have their own
`tootoo.config.js`.

`sync` writes all of these. `publish` writes the ones that are git repos (all
except the root launcher, whose folder is not a repo — it is sync-only).

```text
# git repos — sync + publish
g:\My Drive\2026-theo-github\pushme-pullyou-assets\index.html
g:\My Drive\2026-theo-github\pushme-pullyou-github\index.html
g:\My Drive\2026-theo-github\theo-armour-2025\index.html
g:\My Drive\2026-theo-github\theo-armour-2026\index.html
g:\My Drive\2026-theo-github\theo-armour-aa\index.html
g:\My Drive\2026-theo-github\theo-armour-agenda\index.html
g:\My Drive\2026-theo-github\theo-armour-genealogy\index.html
g:\My Drive\2026-theo-github\theo-armour-pages\index.html
g:\My Drive\2026-theo-github\theo-armour-qdata\index.html
g:\My Drive\2026-theo-github\theo-armour-sandbox\index.html
g:\My Drive\2026-theo-github\theo-armour-wikitheo\index.html
i:\My Drive\tech\index.html

# local launcher — sync only (parent folder is not a git repo)
g:\My Drive\2026-theo-github\index.html
```

The canonical list of record is this file. When a new fork is added, add it here.

---

## 6. Invariants (must always hold)

1. Every published `index.html` is byte-identical to canonical production.
2. All per-repo difference lives in `tootoo.config.js`, never in `index.html`.
3. Dev differs from production by exactly the three identity lines.
4. No command edits `tootoo.config.js`.
5. Only `publish` performs git writes; it always confirms first.

---

## 7. Decisions (resolved 2026-06-21)

- **`i:\My Drive\tech`** — **included** as a full sync + publish target (it is a
  git repo).
- **Root `2026-theo-github\index.html`** — Theo's personal launcher in the folder
  that holds all the repo folders. That folder is **not** a git repo, so it is
  **sync-only** (kept current locally; never published).
- **Branches** — all repos push to their **default branch**. No `gh-pages`
  special-casing for now.
- **Commit messages** — **derived from the changelog**: `publish` uses the dated
  entry that `promote` wrote to `README.md` as the commit message for the run.
