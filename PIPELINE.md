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
6. **Refresh the screenshot** — render the just-promoted production `index.html`
   and overwrite `tootoo-screenshot.jpeg` (repo root, the README's hero image).
   Backs up the old image to `.archive/tootoo-screenshot-<TSF>.jpeg` first. Exact
   commands in **Appendix A**. **Skip** this step when invoked as
   `promote no-shot` — use that for invisible changes that don't alter the UI.
7. **Report**: the backup path(s) created, whether the screenshot refreshed, and
   a `git diff --stat` of production.

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
1. **Pre-flight (read-only)**: for each target, compute whether its `index.html`
   already equals canonical and whether it has uncommitted changes. Print the
   plan and confirm before writing.
2. For each target not already identical:
   a. **Copy** canonical `index.html` → `<repo>/index.html` (overwrite).
   b. Leave everything else untouched — `tootoo.config.js`, `LICENSE`, etc.
3. **Report** a table: each target — updated / already identical / missing.

**Safety model — overwrite even "dirty" targets.** Downstream `index.html` is
generated, never hand-edited (invariant #2), so an uncommitted `index.html` is
just a prior sync that was never published — safe to replace. Each target is its
own git repo, so the last *committed* version is always recoverable. Sync touches
only `index.html`, so unrelated uncommitted work (e.g. `tootoo.config.js`,
`LICENSE`) is never at risk. The pre-flight reports dirty status for visibility,
not to skip.

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

**Eligibility**: `publish` acts only on targets that are git repos. All 13
current targets are git repos. If a non-repo target is ever added it is sync-only
and auto-skipped here — no special-casing needed.

**Steps**
1. Determine the affected set: canonical (from `promote`) + every git-repo target
   updated by `sync`.
2. For each repo, in order:
   a. `git add index.html` (+ `README.md` and `tootoo-screenshot.jpeg` for the
      canonical repo, since `promote` may have changed both; also `PIPELINE.md` /
      `tootoo-dev/` on canonical when those changed).
   b. `git commit -m "<message>"`.
   c. `git push origin HEAD` (current branch — repos vary between `main` and
      `master`).
   d. **If the push is rejected (non-fast-forward)** — the remote has commits the
      clone lacks — `git fetch` then `git rebase` the publish commit onto the
      remote, preserving the remote's other changes and re-asserting **canonical**
      `index.html` on any conflict, then push again. Never force-push.
3. **Report** a table: repo, commit SHA, push result (ok / failed / nothing to
   commit). Continue past a failed repo; never abort the batch silently.

**Does NOT**: force-push or rewrite already-pushed history, push
`tootoo.config.js` changes you didn't make, or auto-resolve real conflicts in
non-`index.html` files (those are reported for you to handle).

GitHub Pages redeploys automatically on push, so "live" follows from the push.

---

## 5. Target set (downstream copies)

Discovered 2026-06-21 by scanning for TooToo builds (`TOOTOO_CONFIG` /
`appName: 'TooToo'`) that are **not** the canonical repo. All have their own
`tootoo.config.js`.

All 13 are git repos, so every one is both a `sync` and a `publish` target.

```text
g:\My Drive\2026-theo-github\heritage-happenings.github.io\index.html
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
- **`heritage-happenings.github.io`** — added 2026-06-21 as the 13th target. It's
  a TooToo build with its own `tootoo.config.js`, and a git repo. The first scan
  reported it as a bare relative `index.html` (it's the working dir), which got
  misread as a phantom file at the container root — there is no `index.html` at
  the container root itself.
- **Dirty downstream `index.html`** — **overwrite it.** Downstream `index.html` is
  generated, never hand-edited, so an uncommitted copy is a stale prior sync, not
  work to preserve (git keeps each repo's last commit; sync touches only
  `index.html`). Resolved 2026-06-21 after the first real sync found 4 such repos.
- **Branches** — all repos push to their **default branch**. No `gh-pages`
  special-casing for now.
- **Commit messages** — **derived from the changelog**: `publish` uses the dated
  entry that `promote` wrote to `README.md` as the commit message for the run.

---

## Appendix A — screenshot capture (promote step 6)

Uses the installed Chrome + built-in .NET image conversion. No installs, no
server. Output keeps the existing filename so no links change.

- **Subject**: the app browsing its own repo — `?owner=pushme-pullyou&repo=tootoo`.
- **Why `--virtual-time-budget`**: it pauses the capture until the GitHub fetch
  resolves, so the shot shows the rendered tree + README, not "Loading tree…".
- **Format**: Chrome emits PNG; we convert to JPEG q90 to preserve
  `tootoo-screenshot.jpeg` (smaller, no README edit).

```powershell
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$root   = "G:\My Drive\2026-theo-github\pushme-pullyou-tootoo"
$tmp    = "$root\tootoo-dev\_shot.png"
$final  = "$root\tootoo-screenshot.jpeg"
$url    = "file:///G:/My%20Drive/2026-theo-github/pushme-pullyou-tootoo/index.html?owner=pushme-pullyou&repo=tootoo"

# 1. back up the current image  (TSF = yyyy-MM-dd-HH-mm, Pacific)
Copy-Item $final "$root\.archive\tootoo-screenshot-<TSF>.jpeg"

# 2. render to PNG (waits for the async fetch)
& $chrome --headless=new --disable-gpu --no-sandbox --allow-file-access-from-files `
  --run-all-compositor-stages-before-draw --virtual-time-budget=20000 `
  --screenshot="$tmp" --window-size=1440,900 "$url"

# 3. convert PNG -> JPEG q90, overwrite the asset, drop the temp
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($tmp)
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | ? { $_.MimeType -eq 'image/jpeg' }
$ps  = New-Object System.Drawing.Imaging.EncoderParameters 1
$ps.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]90)
$img.Save($final, $enc, $ps); $img.Dispose()
Remove-Item $tmp
```
