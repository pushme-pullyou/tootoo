# TooToo Next — Build Prompt

**Status:** draft · **Created:** 2026-11-21 · **Authority:** [SPEC.md](SPEC.md)

You are building TooToo v1 in this repo, one stage at a time. Theo starts each stage with a message like **"build stage 2"**. Do only that stage, verify it, report, and stop. If this prompt and `SPEC.md` disagree, `SPEC.md` wins. Say so in your report.

---

## Part A — Before every stage

### Read first

1. [SPEC.md](SPEC.md): all of it on the first stage, then the sections the stage names.
2. [0-tootoo-next-journal.md](0-tootoo-next-journal.md): the decisions and what earlier stages did.
3. The stage's **Reference** lines, if any. These point to today's TooToo, which is a feature inventory and a record of hard-won fixes. **Do not copy its code.** It is at `g:\My Drive\2026-theo-github\pushme-pullyou-dolittle\`:
   - `src/` and its component `README-*.md` files;
   - `src/ARCHITECTURE.md`;
   - `0-dolittle-journal.md`.

### Hard rules

- **Vanilla only.** Use HTML, CSS and ES2020+ JavaScript as classic `<script src>` files (decision 20): no `import` / `export`, no frameworks, no build tools, no Node, npm or Python. The only tools are PowerShell (`assemble.ps1`, `run-tests.ps1`) and headless Chrome.
- **Functional style.** Use `const` (`let` only when reassigned) and arrow functions. No `var`, no classes, no `this`. Each file defines one namespace object, e.g. `const Router = { parse, build };`.
- **Beginner-readable.** Prefer plain names, short functions, and a one-line comment for any non-obvious rule. CSS custom properties go in `:root`. Dark mode uses `body.dark-mode`.
- **Size budget** (decision 23): at most about 300 lines per file, and about 2,500 lines of JS + CSS in `src/` for all of v1. `run-tests.ps1` reports line counts. If a stage would break the budget, stop and say so rather than trimming quality away.
- **Pinned CDN versions only**, with exact versions. marked and DOMPurify load at startup. Everything else loads on demand through `loaders/index.js` (decision 22).
- **Touch only this repo.** Never edit `pushme-pullyou-dolittle`, `pushme-pullyou-tootoo`, or any install, except where Stage 7 says so.
- **No git commits or pushes.** Theo commits. You may `git add`.
- **Don't add features** that aren't in SPEC.md §6 as "carry" or "new in v1".

### Every stage ends the same way

1. Run `pwsh -File run-tests.ps1`. The stage is done only when it prints `FAIL 0` and the line counts are within budget.
2. Append a journal entry under today's `## YYYY-MM-DD` heading in `0-tootoo-next-journal.md`. Use `*` bullets with bold labels, saying what was built and anything learned.
3. Report:
   - the files created or changed, with line counts;
   - the `PASS n / FAIL n` line;
   - anything in SPEC.md that turned out wrong or unclear;
   - what the next stage needs from Theo, if anything.
4. Stop. Don't start the next stage.

---

## Part B — The stages

### Stage 0 — Scaffold and test harness

**Read:** SPEC.md §4 (source layout, the config block, the assembler) and §9.

**Make:**

- **`src/index.html`:** the app page.
  - The standard `<head>` (charset, viewport, `<title>TooToo</title>`) and `<meta name="tootoo-release" content="dev">`.
  - **The config block** exactly as in §4. It sits early in `<head>`, between the exact marker lines `<!-- TOOTOO-CONFIG-START: your settings. Updates carry this block forward unchanged. -->` and `<!-- TOOTOO-CONFIG-END -->`. It lists every v1 key, commented out, each with a short note (decision 14).
  - The v1 keys and their defaults:
    - `owner: ''`, `repo: ''`, `branch: ''`
    - `view: 'browser'`
    - `appName: 'TooToo'`, `subtitle: ''`
    - `themeColor: ''`, `headingFontUrl: ''`, `headingFont: ''`, `faviconFile: ''`
    - `sourceRepoUrl: 'https://github.com/pushme-pullyou/tootoo'`, `homeUrl: ''`
    - `storagePrefix: 'tootoo'`
    - `hiddenFolders: []`, `hiddenFiles: []` (the tree always hides `index.bak`; SPEC.md §5)
    - `hideDatedBackups: true`, `autoOpenFolderReadme: true`
    - `rightsText: 'No rights reserved'`, `rightsOwners: null`
    - `checkForUpdates: true`, `updateUrl: 'https://pushme-pullyou.github.io/tootoo/releases/latest.json'`
  - The pinned marked and DOMPurify tags, then `<script src>` tags in load order and the stylesheet link. Files that don't exist yet may be added in later stages.
- **`src/styles.css`:** a `:root` token block and a dark-mode block. Real styling comes in Stage 3.
- **`assemble.ps1`:**
  - Reads `src/index.html` and inlines every `<script src>` and `<link rel="stylesheet">` that points into `src/`. CDN tags are left alone.
  - Sets `tootoo-release` from a `-Release rN` parameter (default `dev`).
  - Writes `build/index.html`. Add `build/` to `.gitignore`.
  - Nothing else (§4 "The assembler").
- **`tests/test.js`:** `test( name, fn )` supporting async functions, plus `assert( condition, message )`, `assertEqual( actual, expected, message )` and `assertThrows( fn, pattern )`. It runs all tests, lists each one green or red, and ends with exactly one line `PASS n / FAIL n`. About 40 lines.
- **`tests/index.html`:**
  - Loads `../src/` scripts, then `test.js` and the test files.
  - With `?release=1`, it loads `../build/index.html` in an iframe instead and tests through `frame.contentWindow`. Until later stages this is a placeholder: a test that the frame loads.
- **`run-tests.ps1`:**
  - Runs `assemble.ps1`, then runs headless Chrome on `tests/index.html` and on `tests/index.html?release=1`. Use the command in SPEC.md §9, writing the output to a file.
  - Prints both `PASS / FAIL` lines.
  - Prints line counts per `src/` file and the JS + CSS total against the 2,500 budget.
  - Exits non-zero on any failure or a missing result line.

**Checks:**

- `run-tests.ps1` prints two `FAIL 0` lines, from at least one trivial test.
- `build/index.html` exists and contains no `src="` pointing into `src/`.
- `src/index.html` opens via `file://` without console errors.

### Stage 1 — Core: config, state, events, router

**Read:** SPEC.md §4 (contracts, state ownership) and decisions 12, 18 and 21.

**Make:**

- **`src/core/config.js`:**
  - The defaults from Stage 0, merged with `window.TOOTOO_CONFIG`.
  - Unknown keys are ignored. They are kept in a separate list so About can show them later.
  - A duplicated key behaves as plain JavaScript: the last one wins.
  - `CONFIG` is frozen after the merge.
- **`src/core/state.js`:** one `state` object, plus `on( event, fn )`, `off( event, fn )` and `emit( event, detail )`. The one-writer-per-field rule goes in a header comment, with the ownership table from §4.
- **`src/core/router.js`:**
  - Parses `?owner=&repo=&branch=` and `#path#heading`, and builds those URLs back.
  - Writes `owner`, `repo` and `branch`, and emits `repo-changed`.
  - Listens to `hashchange` to open a file.
- **Tests:** config merge (defaults, an override, unknown keys, duplicate keys), router parse/build round-trips (encoded paths, a heading anchor, no params), and `emit` order and `off`.

**Checks:** `FAIL 0`. The core files are about 250 lines together.

### Stage 2 — Sources and the mock

**Read:** SPEC.md §4 (source contract), decisions 10 and 32, and §10 (folder picker results).
**Reference:** today's `src/components/sidebar/README-sidebar.md` (errors: rate limit, private repo, missing branch, "too large") and `src/js/core.js` (GitHub helpers, token, `detectRepo`).

**Make:**

- **`tests/mock-source.js`:**
  - The four-function source contract over an in-memory tree.
  - It includes: `README.md` with headings; a folder with its own README; a `blog/` folder with month folders and dated posts; a dated backup; `index.bak`; a hidden folder; a dotfolder; and one sample each of `.js`, `.png`, `.mp4`, `.svg`, `.pdf`, `.csv`, `.html` and `.txt`, plus an unknown binary.
- **`src/sources/github.js`:**
  - The four functions over the GitHub REST API (`listTree`, `readText`, `readBlob`, `fileUrl`), with an optional token stored under `storagePrefix`.
  - Rate-limit and private-repo errors open the token panel. A missing branch gets its own message. A tree over GitHub's limit gives the "too large" notice.
  - Repo detection: from params, then a `*.github.io` host, then `CONFIG`.
  - A small text cache for the session.
- **`src/sources/local.js`:**
  - The same four functions over a folder handle (`showDirectoryPicker`).
  - When the picker is missing or throws, it falls back to `<input type="file" webkitdirectory>` (decision 10).
  - **The `file://` start panel** (decision 32): Reopen \<folder\> or Open folder, plus Browse GitHub instead. Handles and the local/GitHub choice are stored in IndexedDB, keyed by `location.pathname`.
  - Reading `.git/config` from a picked folder fills in owner and repo for "Browse GitHub instead".
- **Tests:**
  - A contract test that any source passes, run against the mock.
  - `local.js` path keying and fallback choice, with fake handles.
  - GitHub error mapping, with canned responses (no network).

**Checks:** `FAIL 0`. The local and GitHub paths are tested live in Stage 6 (`live.html`) and on the checklist.

### Stage 3 — Shell, tree, content, Browser view

**Read:** SPEC.md §6 (Shell, Tree, Content and Navigation rows) and §4 (view contract, events).
**Reference:** today's `README-header.md`, `README-sidebar.md`, `README-content.md` and `README-footer.md`. These cover behaviour such as README-first ordering, blog mode, keyboard keys, filter rules, and resize and collapse persistence.

**Make:**

- **`src/ui/shell.js`:**
  - Header: brand icon from `faviconFile`, `appName` / owner / repo links, ⌂ when `homeUrl` is set, dark mode, A−/A+, the About and token panels.
  - Footer: rights text scoped by `rightsOwners`.
  - Heading font, theme color, and the `<title>`.
- **`src/ui/tree.js`:**
  - The tree from `state.tree`: folders first, README-prefixed files next, then others; blog-mode sorting.
  - Hidden folders and files, dotfolders, dated backups, and `index.bak` are left out.
  - The cross-tree filter (hyphen = space), keyboard navigation (`/`, `\`, arrows, Home / End, Enter / Space, Ctrl+B), and README auto-open.
  - Resize and collapse, saved per page.
- **`src/ui/content.js`:**
  - The file header: breadcrumbs, copy / new tab / download, and the raw ↔ rendered toggle where it applies.
  - It hands the file to `Loaders.render`. For now a plain-text loader stub is enough.
  - Writes `currentPath` and emits `file-selected` and `file-rendered`.
- **`src/views/browser.js`:** `{ name: 'browser', mount, unmount }` composing shell, tree and content. A short startup script at the end of `src/index.html` picks the view from `CONFIG.view` and mounts it.
- **`src/styles.css`:** real styling. Phone width works, and the sidebar collapses on narrow screens.
- **Tests (mock source):**
  - the view mounts;
  - tree order and the hidden rules;
  - the filter;
  - keyboard moves;
  - selecting a file emits events in order;
  - a deep link opens the file.

**Checks:** `FAIL 0`. `src/index.html?source=mock` browses the mock via `file://`. This is the only debug hook, and it is ignored in the release build.

### Stage 4 — Loaders

**Read:** SPEC.md §4 (loader contract) and §6 (Content and Heavy formats rows).
**Reference:** `README-content.md` for the HTML preview rules: load the real local or Pages URL when available, use a blob URL otherwise, and never preview an embedded TooToo recursively.

**Make:**

- **`src/loaders/index.js`:**
  - An extension → loader table.
  - Loads each loader's `library` URLs once per page, on first use, and shows a short "loading…" note meanwhile.
  - Unknown text types use the text loader. Unknown binary types offer download.
- **Loaders:**
  - `markdown.js`: marked + DOMPurify, heading ids for `#heading` links, relative image and link paths resolved through the source.
  - `code.js`: highlight.js on demand.
  - `media.js`: images, audio, video, SVG with a raw toggle.
  - `text.js`.
  - `pdf.js`.
  - `csv.js`: a table.
  - `html.js`: an iframe, as in the reference rules.
- **Tests (mock):** each sample file renders the expected element. A library loads only once. An unknown type falls back correctly.

**Checks:** `FAIL 0`. Total `src/` is still within budget. Report the running total.

### Stage 5 — Update check and swap

**Read:** SPEC.md §5 and decisions 3, 4, 13 and 16–19.

**Make:**

- **`src/core/update.js`:**
  - **The check:** reads the page's `tootoo-release` stamp. At most once a day, it fetches `CONFIG.updateUrl`, but only when `checkForUpdates` is on and the visitor is a likely maintainer (`file://`, or a saved token). Release numbers are compared numerically. Failures are silent.
  - **The notice:** "rN available", with a notes link and **Download updated index.html**.
  - **The swap:**
    - Fetches rN's `index.html`.
    - Replaces everything from `TOOTOO-CONFIG-START` through `TOOTOO-CONFIG-END` with this page's own block. The page's block is read from its source text: fetch `location.href`, or use the DOM's comment and script nodes.
    - Offers the merged file as a Blob download.
    - The block's text is never run or changed.
  - About always shows the installed release.
- **Tests:**
  - The swap is byte-for-byte, with comments, unknown keys, CRLF line endings and non-ASCII text.
  - A missing or doubled marker throws a clear error.
  - `r9` < `r10`.
  - The once-a-day rule, with a fake clock.
  - The maintainer rule.

**Checks:** `FAIL 0`.

### Stage 6 — Release mode, live page, checklist, docs

**Read:** SPEC.md §8 and §9 (release checks, release gate).

**Make:**

- **`tests/index.html?release=1`:** the full suite against `build/index.html`, plus the release checks:
  - no `src/` references;
  - exactly one release stamp;
  - each marker exactly once.
- **`tests/live.html`:** a smoke page against the real API (`pushme-pullyou/tootoo`, a handful of calls) that ends with `PASS n / FAIL n`. It is never run by `run-tests.ps1`.
- **`tests/CHECKLIST.md`:** the manual list from §9.
- **`INSTALL-LIST.md`:** copy the 16 rows from `pushme-pullyou-dolittle/INSTALL-LIST.md` (leave out Julia-Morgan), with a new **release** column (`r1` for all).
- **`AGENTS.md`:** this repo's rules for agents (Part A, shortened), the four workshop commands from §8, and a pointer to SPEC.md.
- **`README.md`:** what the repo is, how to open and test it, and a changelog entry.

**Checks:**

- `run-tests.ps1` passes both runs.
- `live.html` passes when Theo runs it.
- Theo works through `CHECKLIST.md`.
- v1 is then **ready to release as r2**. Don't cut it: `release` is a separate chat command (§8).

### Stage 7 — Pilot (only after Theo has released r2)

**Read:** SPEC.md §7.

**Do:**

- Run `update theo-armour-sandbox` as described in §8:
  1. Take r2.
  2. Paste `tootoo.config.js` between the markers.
  3. Rename the old `index.html` to `index.bak`.
  4. Check it via `file://`.
  5. Delete `tootoo.config.js`.
  6. Show the diff.
- Commit and push only after Theo confirms. Update the install's row in `INSTALL-LIST.md` to `r2`.

**Checks:** Theo browses the sandbox locally and on Pages for a few days before the other 15 are migrated.

---

## Part C — After v1 (not part of this build)

These are new views and loaders on the same contracts. Each gets its own spec section before any work starts:

- the Hub and Gallery views (decision 9);
- SheetJS and notebook loaders;
- the branch switcher and smart Pages links;
- a config editor (decision 15).
