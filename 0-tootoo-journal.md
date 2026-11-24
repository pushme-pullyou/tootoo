# TooToo Next — Development Journal

## 2026-11-22Header title

Settled 2026-11-22, and added to [SPEC.md](SPEC.md) §6 (Header). For the next release.

**Left to right:**

1. **Icon:** the `faviconFile` image; when none is set, a small GitHub mark. It links to the repo on GitHub: `https://github.com/<owner>/<repo>`.
2. **Owner:** the owner's GitHub login as-is (e.g. `pushme-pullyou`), linking to their home page: `https://<owner>.github.io`.
3. **Repo:** the repo name, linking to its Pages site: `https://<owner>.github.io/<repo>`. Always the Pages URL; checking whether the repo has Pages stays "Later".
4. **App name:** `appName` from the settings block (e.g. "TooToo Next"), linking back to the start: this page with no file open. Left out when it only repeats the repo name ("TooToo Next" after `tootoo-next`, ignoring case, spaces and punctuation).
5. **Subtitle:** `subtitle`, as today.

**The owner's own site repo** (`<owner>/<owner>.github.io`): leave out the repo; show only the owner, linking to `https://<owner>.github.io`. Example: [pushme-pullyou](https://pushme-pullyou.github.io).

**Local folders:**

* A clone of a GitHub repo: owner / repo links as usual, with 📂 in front to show the files come from disk.
* No GitHub repo: 📂 and the folder name in place of owner / repo, with no links.

**No repo known:** owner and repo are left out, and the icon links nowhere.

## File header: the file on GitHub

Settled 2026-11-22, and added to [SPEC.md](SPEC.md) §6 (File header). For the next release.

* A small GitHub mark before the breadcrumbs, linking to the open file on GitHub: `https://github.com/<owner>/<repo>/blob/<branch>/<path>` (`HEAD` when no branch is set). Same tab.
* The breadcrumbs drop the repo name at the start (the mark leads to the repo): `folder / … / file`. Folders still link to their README.
* **↗ New tab** stays: it opens the raw file, this opens the GitHub page.
* A local clone links to the pushed file, titled "on GitHub (may differ from your local copy)". No GitHub repo, no mark.


## 2026-11-21

* **Repo started.** A new sibling repo for the TooToo and Dolittle rebuild, so
  today's Dolittle, production and the 16 installs stay untouched on r1 while the
  new design takes shape. It is a local git repo only for now, with no GitHub
  remote.

* **First decisions**, recorded in [SPEC.md](SPEC.md) §3:
  * Fresh start.
  * Pull releases, not push.
  * Notify-only update check.
  * Config embedded in `index.html`.
  * One core plus views and loaders.
  * Same vanilla, `file://` constraints.
  * Hand-doable swap for any installer.
  * A new sibling repo.

* **Next:** work through the open topics in SPEC.md §10 one at a time, then derive
  a staged build prompt from the settled spec.

* **v1 scope agreed** (SPEC.md decisions 9–11, §6):
  * Browser view only; Hub and Gallery come next.
  * Local files through a folder picker, which replaces the side-by-side trick.
  * Today's features carried, except a few moved to later: branch switcher,
    smart Pages links, hover counts, SheetJS, notebooks.
  * PDF, CSV and HTML become loaders fetched on demand.
  * The self-test moves to the test pages.

* **Config block and swap agreed** (SPEC.md decisions 12–15, §4, §5):
  * The block is today's `window.TOOTOO_CONFIG = { … }` between
    `TOOTOO-CONFIG-START` / `END` markers early in `<head>`, so each install
    migrates by paste.
  * A fresh release lists every key, commented.
  * The update notice offers **Download updated index.html**, with the page's
    own block inserted into rN.
  * No config editor in v1.
  * Still to check: whether a `file://` page can fetch from the release site
    (CORS).

* **Release host agreed** (SPEC.md decisions 16–19, §5):
  * Releases stay in `pushme-pullyou/tootoo`: frozen `releases/rN/`, the root
    `index.html` as the latest release, and a GitHub Release page per rN.
  * Installs read `releases/latest.json` on Pages, which allows cross-origin
    fetches and uses no API quota.
  * The check runs at most once a day.
  * Config keys `checkForUpdates` and `updateUrl`.
  * The notice is shown only on `file://` or when a token is saved, so public
    readers never see it.

* **Browser tests** (a scratch test page, Chrome 157 via `file://`):
  * Passed: fetching r1 from GitHub Pages, a readable 404 for `latest.json`, and
    the merged-file download. The swap download (decision 13) works.
  * The folder picker exists, but the first tries ended in `AbortError`. Still
    open.

* **Folder picker settled** (SPEC.md decision 10, §10):
  * The picker failed in Chrome 157 on every site, with no dialog. Cause: a
    Chrome 157 bug, fixed by updating to 158.
  * In Edge it read `G:\…\theo-armour-sandbox` (603 files) in 0.6 s from
    `file://`. After a fresh visit it reused the stored folder with one
    permission click.
  * The folder-upload input (`webkitdirectory`) works in every browser.
  * Decision 10 is now: picker first with "Reopen last folder", falling back to
    the upload input when the picker is missing or fails.

* **Architecture agreed** (SPEC.md decisions 20–23, §4):
  * Classic `<script src>` files that run straight from `src/index.html`; the
    assembler only inlines them, with no dev/production split.
  * One `state` object with one writer per field, plus `on` / `emit` events.
  * marked and DOMPurify at startup; other libraries on demand.
  * Budget: about 300 lines per file and about 2,500 for v1.
  * GitHub and local sources share one four-function interface. Loaders and
    views are small objects.

* **Testing agreed** (SPEC.md decisions 24–27, §9):
  * One `tests/index.html` with a homemade `test` / `assert` and a mock source.
    `?release=1` runs it against the assembled file.
  * Agents run it in headless Chrome (`--dump-dom`) and read
    `PASS n / FAIL n`. Checked: it waits for async tests and network fetches.
    The output must go to a file.
  * A separate live smoke page for the GitHub API, run by hand.
  * Release gate: the suite, the live page, and a manual checklist.

* **Workshop and migration agreed** (SPEC.md decisions 28–31, §7, §8):
  * This repo becomes Dolittle after migration. The old one is archived as
    `dolittle-2026-11`.
  * Commands are `build`, `test`, `release` and `update <install>`.
  * `INSTALL-LIST.md` becomes Theo's checklist with a release column.
  * r2 is the first rebuild release, piloted on `theo-armour-sandbox`, then the
    other 15.
  * Each install's `tootoo.config.js` is deleted in its migration commit, and
    rollback is a revert.

* **Cloned repo on `file://` agreed** (SPEC.md decision 32):
  * The page shows a start panel: Reopen \<folder\> or Open folder, plus Browse
    GitHub instead. Nothing is fetched from GitHub until you choose.
  * The choice is remembered per page path.
  * This replaces today's flag-dependent side-by-side read with one click.
* **Spec complete** apart from Hub and Gallery, which come after v1.
  * Next: the staged build prompt.

* **Build prompt drafted** in [BUILD-PROMPT.md](BUILD-PROMPT.md):
  * Part A holds the rules for every stage.
  * Part B has eight stages: scaffold and test harness; core; sources and mock;
    shell, tree, content and Browser view; loaders; update and swap; release
    mode and docs; pilot.
  * Part C lists the work after v1.
  * Theo runs one stage at a time ("build stage N"). Each stage ends with
    `run-tests.ps1` at `FAIL 0`, a journal entry, and a stop.
  * The v1 config keys come from today's `core.js` defaults: `preferPagesUrls`
    dropped; `view`, `checkForUpdates` and `updateUrl` added; `hiddenFiles`
    defaults to `index.bak`.

* **Stage 0 built: scaffold and test harness.**
  * `src/index.html` has the config block between the exact markers, with every
    v1 key commented out and a short note. marked 12.0.2 and DOMPurify 3.4.1 are
    pinned from today's build. `src/styles.css` holds only the tokens and the
    dark-mode block.
  * `assemble.ps1` stamps `tootoo-release`, inlines `src/` scripts and the
    stylesheet, and writes `build/index.html` (gitignored). It refuses an
    inlined file that contains `</script` or `</style`, or a config marker. A
    marker inside `update.js` would give the release two blocks and break the
    swap, so Stage 5 must build the marker strings from parts.
  * `tests/test.js` (45 lines): `test`, `assert`, `assertEqual`, `assertThrows`
    and `runTests`. A script that fails to load, or throws while loading,
    counts as a failure, so a broken file can't give a false `FAIL 0`.
  * `run-tests.ps1` runs both modes and prints the failing test names and the
    line counts. Chrome's stderr log noise goes to a side file.
  * Checked: a failing test, a missing test file, a missing `src/` file and a
    marker in a source file all exit non-zero. Both `src/index.html` and the
    build open with no console errors.
  * **Learned:** top-level `const Router = …` in a classic script is a global
    binding but not a `window` property, so the release-mode tests can't read
    `frame.contentWindow.Router`. Stage 6 can use `frame.contentWindow.eval(
    'Router' )`, or each file can also set `window.Router`.

* **Stage 1 built: core config, state, events and router** (167 lines together).
  * `core/config.js`: `Config.defaults`, `Config.merge( block )` and
    `Config.unknownKeys( block )`, then the frozen `CONFIG`. Arrays are copied
    and frozen too. A test pastes the sandbox's `tootoo.config.js` as-is: the
    last `subtitle` wins, and `faviconLetters` and `faviconColor` are listed as
    unknown.
  * `core/state.js`: `state` plus `Events.on` / `off` / `emit`, with the
    ownership table in the header. An unknown event name throws, so a typo
    can't fail silently. A failing listener is logged and the next one still
    runs.
  * `core/router.js`: `parse`, `build`, `current`, `setRepo`, `start`. The URL's
    repo is used only when it has both owner and repo; otherwise CONFIG's.
    Other query params, such as `?source=mock`, are kept.
  * **New event `open-requested`:** on a hash change the router asks for the
    file, and `content.js` opens it and owns `currentPath`. The router can't
    write `currentPath` itself. Deep links on first load use
    `Router.current()` after `tree-loaded`.
  * **Learned:** the URL `hash` setter drops one leading `#`, so a heading with
    no path (`##top`) needs the `#` added by hand. The round-trip test caught
    it.
  * Classic scripts share one global scope, so each file keeps its helpers
    inside its namespace object, test files included.
  * The test harness gained a 5-second timeout per test, and a test that checks
    `tests/index.html` loads the same `src/` scripts, in the same order, as
    `src/index.html`.

## 2026-11-22

* **`index.bak` always hidden** (Theo, answering Stage 1's question). A block
  that sets `hiddenFiles`, like the sandbox's, would have replaced the default
  and shown `index.bak`. The tree now always hides it, and the `hiddenFiles`
  default is `[]`. SPEC.md §5 and BUILD-PROMPT.md updated. `open-requested`
  added to the SPEC.md §4 event list.

* **Stage 2 built: sources and the mock.**
  * `sources/github.js` (137 lines): the four functions over the REST API.
    Errors carry a `kind` (`rate-limit`, `bad-token`, `private`,
    `missing-branch`, `too-large`, `not-found`, `http`), and `needsToken` is
    true for the first three, so Stage 3's shell can open the token panel. A
    tree 404 checks whether the repo is readable, to tell a missing branch from
    a private repo. Without a token, files come from raw (no headers, no
    preflight, no quota); with one, from the Contents API. There is a 50-file
    text cache.
  * **Repo detection order:** `?owner=&repo=`, then CONFIG, then the
    `*.github.io` host. That is today's proven order. BUILD-PROMPT.md said host
    before CONFIG, which would ignore an installer's explicit block on Pages.
    `Router.start( repo )` now takes the result.
  * The token key is `<storagePrefix>:githubToken`, without today's
    `location.pathname`, so tokens saved under r1 need entering once more.
  * `sources/local.js` (195 lines): the same four functions over a folder
    handle, or over the `webkitdirectory` upload. `.git` stays out of the tree;
    only `.git/config` and `.git/HEAD` are read, to find the GitHub repo. Then
    the start panel: Reopen \<folder\> / Open folder / Browse \<owner/repo\> on
    GitHub instead. The remembered choice comes first. A picker that throws,
    whether a cancel or the Chrome 157 bug (both give `AbortError`), reveals
    the upload button.
  * Tests: `tests/mock-source.js`, `tests/source-contract.js` (a reusable
    contract check, run on the mock, a fake folder handle and fake uploaded
    files) and `tests/test-sources.js`.
  * **Learned: IndexedDB on `file://` never answers in headless Chrome.** No
    success, no error. So every IndexedDB call now gives up after 2 s, and the
    panel still appears, without memory. The tests use an in-memory store, and
    the real IndexedDB is checked on the manual checklist.
  * **Learned: `--virtual-time-budget` treats a page waiting on a Blob or file
    read as idle**, and either jumps to the next timer or dumps the page
    early. The Stage 1 per-test timeout fired falsely, and runs stalled in a
    different place each time. Fix: `runTests` keeps the page busy with a
    `MessageChannel` loop until it ends, and the per-test timeout is gone.
    `run-tests.ps1` stops Chrome after 60 s of real time and names the last
    test that finished. Three runs in a row, all `FAIL 0`.

* **Stage 3 built: shell, tree, content and the Browser view** (JS + CSS now
  1,436 of 2,500).
  * `ui/shell.js` (192 lines): the header (☰, brand, owner / repo links or
    📂 folder, subtitle, ⌂, 🌓, A− / A+, ⚙️, ?), the footer rights line, the
    About and token panels, branding from CONFIG, and dark mode and text size
    saved per page. Theme color and heading font are set on `<body>`, so an
    explicit color also wins in dark mode.
  * `ui/tree.js` (284 lines): the visibility rules (`index.bak` always hidden),
    sorting with blog mode, the filter, the keyboard, README and latest-post
    auto-open, and resize and collapse saved per page. Narrow screens start
    collapsed. Rows are plain `#path` links, so a click, an arrow key or a
    deep link all open files the same way: hash → `open-requested` → content.
  * `ui/content.js` (132 lines): breadcrumbs (a folder links to its README),
    raw ↔ rendered (remembered per file type), copy, new tab, download. A file
    is drawn off-page and swapped in, so a slow earlier file can't land on top
    of a newer one. `history.replaceState` keeps the address on the open file.
  * `views/browser.js` (94 lines): layout, mount / unmount, the source choice
    (`?source=mock` on the source page only, the start panel on `file://`,
    GitHub otherwise), the tree load and the first file. The view owns
    `state.source` and `state.tree`; SPEC.md §4 and `state.js` updated.
  * `loaders/index.js` is a plain-text stub until Stage 4.
  * Tests (`tests/test-ui.js`, 12 tests): tree order and hidden rules, blog
    mode, root README, the rights line, the mounted view, event order, deep
    link, missing file, filter, keyboard, and a token error opening the panel.
  * **Learned:** the assembler must inline stylesheets before scripts. A
    `<link rel="stylesheet">` string inside `shell.js` was matched after the
    script pass. Each pass now only scans the original text.
  * **Learned:** headless Chrome won't make a window narrower than about 500px,
    so phone width was checked by putting the page in a 390px iframe. It also
    remembers window size per profile, which made a test depend on the
    previous run. `run-tests.ps1` now passes `--window-size=1200,800`.
  * Screenshots checked: desktop (blog mode open on the latest post), phone
    width, and the `file://` start panel. No console errors.

* **Stage 4 built: loaders** (JS + CSS now 1,815 of 2,500).
  * Each loader file defines one object; `loaders/index.js` loads last and
    builds the extension table from them. Loader contract:
    `{ extensions, library?, toggle?( ext ), render( file, element ) }`.
  * `markdown.js`: marked → DOMPurify into an inert `<template>`, so images
    don't start loading from the wrong place while links are fixed. Headings
    get GitHub-style ids, with `-1`, `-2` for repeats. Relative links become
    `#path#heading` (a folder opens its README); relative images load through
    the source. Fenced code is highlighted. A heading in the open file now only
    scrolls, without re-rendering.
  * `code.js`: highlight.js 11.9.0 (common languages), the one CDN library
    loaded on demand. Its colors are our own CSS rules, so dark mode needs no
    theme file. The Raw view of Markdown, HTML, CSV and SVG goes through it.
  * `media.js` (images, SVG, audio, video), `pdf.js` (the browser's viewer in
    a frame), `csv.js` (a small hand-written parser, first 2,000 rows),
    `text.js`.
  * `html.js`: an unsandboxed frame. It loads the real published page when
    running on the repo's own Pages site, or the file beside the app on
    `file://` when the picked folder is the app's folder (same size).
    Otherwise it uses a blob copy. A page containing `TOOTOO_CONFIG` is never
    previewed, so the app can't show itself recursively.
  * Unknown types: text, unless the first 4 KB hold a zero byte, then a
    download note. Known binary types (zip, docx, fonts…) skip that read.
    Text over 2 MB is offered for download. Copy hides for binary types.
  * Typed blob URLs (SVG, audio, video, PDF), because raw GitHub serves them
    as plain bytes. They are freed when the next file opens.
  * Tests (`tests/test-loaders.js`, 11): every mock sample, Markdown links /
    images / ids / sanitizing, the TooToo guard, unknown text and binary,
    library-once (with `tests/fake-library.js`), toggles, path resolving, CSV
    quoting. The test page now loads marked and DOMPurify from the CDN, so
    the suite needs the network.
  * Screenshots checked: Markdown, highlighted code, CSV table, HTML frame. No
    console errors.

* **Stage 5 built: update check and swap** (`core/update.js`, 168 lines; JS +
  CSS now 1,987 of 2,500).
  * The check runs only on a numbered release (never `dev`), only for a likely
    maintainer (`file://` or a saved token), and only if `checkForUpdates`.
    It reads `updateUrl` at most once a day, and remembers both the time and
    the answer (`<storagePrefix>:update`), so the notice shows all day without
    asking again. `r9` < `r10`. Failures, a 404 and a malformed `latest.json`
    are all silent.
  * The notice sits above the file: "TooToo rN available (this page has rM)",
    What's new, **⬇ Download updated index.html**, ✕.
  * The swap replaces rN's block, markers included, with the page's own, as
    text. The page's source is fetched for exact bytes; when that isn't allowed
    (`file://` without the flag), the block is rebuilt from the DOM's comment
    and `<script>` nodes, where the browser has already turned CRLF into LF. A
    missing, doubled or backwards marker is a clear error, and the notice then
    explains the by-hand swap.
  * The markers are built from parts in `update.js`, so the assembled file
    still has each one exactly once.
  * Tests (`tests/test-update.js`, 10): numbers, the maintainer rule, once a
    day with a fake clock, the quiet cases, silent failures, byte-for-byte
    swap (CRLF, comments, unknown and duplicated keys, non-ASCII), marker
    errors, `src/index.html` swapping into itself unchanged, the DOM rebuild,
    and the notice → download → saved file.
  * **Checked end to end on real files:** r2 and r3 assembled into a scratch
    folder, the r2 install given its own block (theme color, ☕, a retired key,
    CRLF) and a local `latest.json`. Opened via `file://`, it showed "TooToo r3
    available" in its own theme color. The merged file was byte-identical to
    r3 with the install's block (94,475 bytes).

* **Stage 6 built: release mode, live page, checklist, docs.** v1 is ready to
  release as r2, once `live.html` and the checklist pass by hand.
  * **`?release=1` now runs the whole suite inside `build/index.html`.**
    `tests/index.html` keeps one list of test files. In `src/` mode it loads the
    source files and the tests into itself. In release mode it opens the build
    in a frame, unmounts the build's own startup view, adds the same test files
    to the frame, and reads the results back. The tests therefore exercise the
    inlined code. (Top-level `const` names aren't `window` properties, so the
    page reaches `BrowserView` and `runTests` through `contentWindow.eval`.)
    Checked by breaking `index.bak` hiding in the build only: the `src/` run
    passed, the release run failed 4 tests.
  * `tests/test-release.js` (4, release mode only): the suite runs on inlined
    code; no `<script src>` or stylesheet link points into `src/`; exactly one
    release stamp; each marker once; the block matches `src/index.html`. It
    caught a comment in `browser.js` that spelled out a script tag.
  * `tests/live.html` (5 tests, about 7 requests): the tootoo tree on its
    default branch, the source contract on GitHub, missing branch, missing
    repo, and the release site (`latest.json` 200 or 404, r1 published). It
    shows the remaining API quota. Passed once in headless Chrome.
  * `tests/CHECKLIST.md`: the §9 manual list, plus what the headless runs
    can't reach: IndexedDB on `file://`, the real picker, dark mode, media
    playback, and a step-by-step fake r1 → r2 update.
  * `INSTALL-LIST.md` (16 installs, all r1, Julia-Morgan left out), `AGENTS.md`
    (rules, the four commands, where things are), and `README.md` (open, test,
    changelog).
  * Totals: `src PASS 75 / FAIL 0`, `release PASS 78 / FAIL 0`, JS + CSS 1,987
    of 2,500.

* **Fix: the README never replaced the start panel** (found by Theo on the
  checklist: the sandbox folder's tree loaded, but the content still said
  "Open this repo from disk?").
  * Cause: the panel was drawn over the whole `.file-view`, wiping content's
    header and body. The README then rendered into the old, detached body.
    The tests always passed the mock source directly, so they never went
    through the start panel.
  * Fix: the panel goes inside `.file-body`, so the first message replaces it.
    The view clears `state.tree` on mount, and content ignores
    `open-requested` until a tree has loaded. A stale hash change from an
    earlier test had re-opened the old tree's README over the panel, and in
    real use a hash change before the tree loads could have done the same.
  * New test: the real startup path on `file://` with a fake picker. Pick a
    folder; its README shows, the panel is gone, the header says 📂 pages. It
    fails without the fix.
  * `src PASS 76 / FAIL 0`, `release PASS 79 / FAIL 0`.

* **Release r2 cut** (`release`, 2026-11-22). The gate: `src PASS 76 / FAIL 0`,
  `release PASS 79 / FAIL 0`, `live.html` passed, CHECKLIST worked through by
  Theo (the Pages install item waits for the pilot).
  * `pushme-pullyou-tootoo` commit `91bd46a`: `releases/r2/index.html` (the
    default block), `releases/latest.json`, and the root `index.html` as r2
    with tootoo's own settings switched on in the default block (theme,
    subtitle, Fraunces, rights owners), rather than its old
    `tootoo.config.js` pasted as-is: the root is the demo strangers copy, and
    that file's comments describe r1. `tootoo.config.js` deleted;
    `releases/r1/` keeps its own copy.
  * README rewritten where it described r1 (config, storage keys, SheetJS,
    sandboxed previews); FORKING.md marked as r1; AGENTS.md and CLAUDE.md
    point at this repo as the workshop.
  * GitHub Release `r2 — 2026-11-22` with `index.html` attached (96,588
    bytes). Tag `r2` here on `d2001ab`.
  * Learned: r1 kept the token per page (`<prefix>:<pathname>:githubToken`),
    v1 per prefix, so a saved token must be entered again once. The release
    notes say so.
  * **Next:** Stage 7, the pilot: `update theo-armour-sandbox`.

* **Pilot: `update theo-armour-sandbox`** (Stage 7).
  * r2's `index.html` with the sandbox's `tootoo.config.js` pasted as-is
    between the markers, inside a `<script>`. Everything after the block is
    byte-identical to `releases/r2/index.html`. The old r1 file is now
    `index.bak`, and `tootoo.config.js` is deleted. `INSTALL-LIST.md` row → r2.
  * Checked via `file://` in headless Chrome: Sandbox in Patua One, the gold
    theme, the second `subtitle`, the start panel, no console errors.
  * **Learned:** the Claude in Chrome extension can't open `file://` pages, so
    the `update` check uses headless Chrome (`--screenshot`, `--dump-dom`).
  * **Learned:** r1 linked `favicon.ico` in its own `<head>`. In r2 the tab
    icon comes only from `faviconFile`, so an as-is paste leaves an install
    with no icon unless its block sets that key. The sandbox's block now sets
    `faviconFile: 'favicon.ico'`; the other 15 will need the same line.
  * Committed in the sandbox as `67c9a03`.
  * **Next:** live with it a few days, locally and on Pages, then the other 15.

* **A root `index.html` for the workshop.** The repo, now
  `pushme-pullyou/tootoo-next`, had no front page. Its root `index.html` is
  r2 with its own settings switched on in the default block (owner/repo,
  appName "TooToo Next", subtitle, theme, `storagePrefix: 'tootoo-next'`,
  rights owners), so Pages and `file://` both browse this repo. It's the
  17th row in INSTALL-LIST, updated with `update tootoo-next`, never by hand.
  The release, not `build/`, because a build changes with every edit.
  * Live check after the push: the root page and `/src/` browse the repo on
    Pages (47 files, README). `/tests/` ran `PASS 75 / FAIL 1`: the
    start-panel test only applies on `file://`. It now returns early
    elsewhere. `run-tests.ps1` still `PASS 76 / FAIL 0` and `PASS 79 / FAIL 0`.
  * Favicon: the pushmi-pullyu icon from `pushme-pullyou-assets`, copied as
    `favicon.svg` and set as `faviconFile` in the root page's block. A
    relative name works on Pages and on `file://`.

* **Header title rebuilt** to the new SPEC §6 Header (settled today in
  `0-tootoo-next-agenda.md`). For r3.
  * Left to right: the icon (`faviconFile`, or a built-in GitHub mark in the
    text color) → the repo on GitHub; the owner → `https://<owner>.github.io/`;
    the repo → its Pages site; the app name → back to the start; the subtitle.
  * The owner's own site repo shows only the owner. A local clone shows 📂
    before owner / repo; a folder without a GitHub repo shows 📂 and its name.
    With no repo, the icon has no link.
  * `Shell.titleLinks( owner, repo )` holds the rules, as a pure function
    with its own test. The view test checks the four links in order.
  * `src PASS 77 / FAIL 0`, `release PASS 80 / FAIL 0`; JS + CSS 2,021 / 2,500.

* **The file on GitHub** (SPEC §6 File header, settled today). A small GitHub
  mark before the breadcrumbs links to the open file's page on GitHub,
  `…/blob/<branch or HEAD>/<path>`. For r3.
  * `Content.githubUrl( owner, repo, branch, path )` is pure and tested
    (spaces, a branch with a slash, no repo). The view tests check the link on
    the mock, and on a local clone with its "may differ" title.
  * `src PASS 78 / FAIL 0`, `release PASS 81 / FAIL 0`; JS + CSS 2,031 / 2,500.

* **The root `index.html` runs the latest build** (Theo: a broken build on the
  front page gets fixed sooner). `assemble.ps1` step 4: on a `dev` build only,
  it rewrites the root with the new build plus the root's own config block,
  the same text swap as an update. `-Release rN` leaves it alone, so cutting a
  release can't stamp it. Checked: block byte-identical, stamp `dev`, new
  header in place; `src PASS 78 / FAIL 0`, `release PASS 81 / FAIL 0`.
  INSTALL-LIST's 17th row now says `dev (every build)`; SPEC §4 notes the
  addition.

* **No repeated name in the header** (Theo, from the r3 preview: "tootoo-next"
  then "TooToo Next"). The app name is now left out when it only repeats the
  name before it, ignoring case, spaces and punctuation
  (`Shell.sameName`, tested). "Pages" after `theo-armour.github.io` still
  shows. SPEC §6 Header item 4 updated. r3 held for this.
  * `src PASS 79 / FAIL 0`, `release PASS 82 / FAIL 0`; JS + CSS 2,040 / 2,500.
  * Also from the preview: the breadcrumbs drop the repo name at the start,
    since the GitHub mark already leads to the repo. They read
    `folder / … / file`. Tests unchanged in number: 79 and 82, FAIL 0.

* **Release r3 cut** (`release`, 2026-11-22): the new header, no repeated
  names, and the file-on-GitHub mark.
  * Gate: `src PASS 79 / FAIL 0`, `release PASS 82 / FAIL 0`, `live.html`
    `PASS 5 / FAIL 0` (headless). The by-hand checklist wasn't rerun; Theo
    reviewed the header from screenshots, and two rounds of his feedback went
    in before the cut.
  * tootoo-next `9315831`, tag `r3`, release on `pushme-pullyou/tootoo-next`.
    `pushme-pullyou-tootoo` `0137096`: `releases/r3/index.html`, root
    `index.html` as r3 with its own block carried over byte for byte,
    `latest.json` → r3. GitHub Release `r3 — 2026-11-22` with `index.html`
    (100,098 bytes). All four URLs serve 200; the demo's header shows
    `pushme-pullyou / tootoo` with "TooToo" hidden.
  * Learned: running `assemble.ps1` from a nested `pwsh` under the Bash
    tool is blocked by the execution policy, and the release script then
    copied the old `dev` build without stopping. Caught before any commit;
    the release script now checks the build's stamp.
  * Next: the sandbox (on r2) should now show "r3 available" when opened
    from disk. A real test of the update notice.
  * `update theo-armour-sandbox` to r3: sandbox `dcfb7b9`. Block carried
    byte for byte; the r2 file is now `index.bak`. Committed only those two
    files; Theo's uncommitted edit stayed out, and a pending remote commit
    was rebased in with `--autostash`.

## 2026-11-23

* **The other 15 installs moved to r3** (r1 → r3 directly; the sandbox was
  already on r3). Each commit: r3's `index.html` with the install's
  `tootoo.config.js` pasted between the markers, the r1 file as `index.bak`,
  `tootoo.config.js` removed. All 15 checked from `file://` first (title,
  stamp, theme color); 13 Pages sites serve r3.
  * Settings choices (Theo): heritage-happenings.github.io and
    heritage-happenings-documents took their uncommitted `tootoo.config.js`
    edits (the latter with "papees" → "papers"). theo-armour-2026's
    uncommitted file held pushme-pullyou's settings, a stray paste, so its
    committed settings went in; the stray copy is kept in the scratch folder.
  * **Google Drive vs git.** In 5 repos the deleted `tootoo.config.js` came
    back before the commit, so it was kept (or, in documents, committed with
    Theo's edit); follow-up commits removed it. In theo-armour-pages a stale
    `.git/index.lock` blocked the commit, and after it the index was
    reported corrupt; removing the stale lock, then rebuilding the index
    from HEAD (`git reset`), fixed it. Nothing was lost; GitHub had every
    commit. Lesson for batch git work on `G:`: one repo at a time, and
    verify each commit's files before pushing.
  * theo-armour-agenda and theo-armour-wikitheo: their Pages builds had
    been failing for weeks before r3 (since 2026-11-20 and 2026-11-02), so
    their live sites still show old pages. Pre-existing; the r3 commits
    started a new build for each.

* **Pages builds and `.nojekyll`.** wikitheo's Pages build had failed since
  2026-11-02: `timeline/rive-gaouch-m-and-wisconsin-dc.md` was a JPEG, which
  Jekyll can't read. Renamed to `.jpg` (wikitheo `d370fdb`). agenda's failed
  on Wikipedia `{{cite …}}` markup that Jekyll reads as Liquid.
  * Added an empty `.nojekyll` to wikitheo and 12 more public installs
    (pages and qdata had one), so Pages serves files as they are and no file
    can break the build. All 13 rebuilt and serve r3 (tootoo-next: `dev`).
    Checked first: no install uses front matter or Liquid; genealogy's
    `_codex-backup…` folders become servable, but that repo is public.
  * **Private repos, public Pages:** theo-armour/agenda and theo-armour/aa
    are private, but their Pages sites are public, so their files are
    readable by URL without a token. TooToo's token rule only covers what
    TooToo reads through the API. Left alone, no `.nojekyll`; the fix is
    Theo's setting: Pages → Source: None. TooToo still reads them locally,
    or online from another install with a token.

* **Tidy-up.** CHECKLIST's last item ticked: the live sandbox (r3) browses
  its repo with no parameters and opens `sample-page.html` at its published
  URL. INSTALL-LIST: the intro and the pilot note brought up to date, plus a
  note never to publish Pages for a private repo. `tests/release-scratch/`
  (Theo's checklist copies of the build, about 6,300 lines) removed; git
  keeps them.
  * Still untested on a real install: the "rN available" notice and its
    download. Next release: open any install from disk and use the button.

* **Decision 28 revised: tootoo-next becomes `tootoo`; Dolittle stays the
  core.** Theo: rename today's `tootoo` to `tootoo-2026` (left active) and
  this repo to `tootoo`; Dolittle stays the family's core, which spawns
  TooToo, GubGub, DabDab and JipJip (the Menagerie). Shared code moves into
  Dolittle when GubGub begins ("always afraid of abstracting too soon").
  * The catch: every install's update check reads
    `pushme-pullyou.github.io/tootoo/releases/latest.json`, and Pages
    addresses aren't forwarded on a rename. So this repo becomes the release
    host too: `releases/` copied in from the old repo's committed blobs, all
    five files byte-identical.
  * The root page stays the latest build (Theo); the README's new "Get
    TooToo" section points strangers to Releases.
  * Step 1 of 6 done (prepare). Next: rename old `tootoo` → `tootoo-2026`,
    then this repo → `tootoo`, then fix GitHub Releases, links and Dolittle.

* **The swap is done.** `pushme-pullyou/tootoo` → `tootoo-2026` (README
  banner `f0adf58`, left active), then `tootoo-next` → `tootoo`. Both local
  remotes repointed. `/tootoo/releases/latest.json` answered r3 from the new
  repo straight after the second rename, so no install's update check broke.
  The rename cancelled one tootoo-2026 Pages run; another followed.
  * Names: journal and agenda renamed to `0-tootoo-journal.md` and
    `0-tootoo-agenda.md`; README, AGENTS and SPEC titled "TooToo"; Pages links
    point to `/tootoo/`. The root page's block now says `repo: 'tootoo'`,
    `appName: 'TooToo'` (hidden as a repeat). `storagePrefix` stays
    `'tootoo-next'`, so saved settings and the token survive.

* **Header: the default app name is no longer shown.** Theo saw "TooToo" in
  genealogy's header. Not a broken copy: genealogy sets no `appName`, so the
  default showed, and "TooToo" doesn't repeat "genealogy".
  theo-armour.github.io had the same gap. New rule (SPEC.md §6 Header, item
  4): the app name shows only when the install sets its own `appName` and it
  isn't a repeat of the name before it. `Shell.showsAppName` in
  `src/ui/shell.js`; one new test, one changed. The tab title and About
  still use the default.
  * For the next release: installs see the change only after r4 and
    `update <install>`.

* **`tootoo-2026` renamed `tootoo-2026-11`** (Theo), to sit beside
  `tootoo-2026-10`. The entries above keep the name as it was at the time.
  SPEC.md, the old repo's README banner, the pushme-pullyou.github.io README
  and the global instructions now say `tootoo-2026-11`.
  * Found on the way: the local folder `pushme-pullyou-tootoo-2026-10` had
    its remote pointing at `pushme-pullyou/tootoo`, now this repo. Repointed
    to `pushme-pullyou/tootoo-2026-10`.
