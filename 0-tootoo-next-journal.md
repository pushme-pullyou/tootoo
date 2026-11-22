# TooToo Next — Development Journal

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
