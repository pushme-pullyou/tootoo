# Forking TooToo

A guide for developers who want to fork TooToo and modify it. For the basic "edit `CONFIG`, push, enable Pages" flow, see the **Fork & Customize** section of [`README.md`](README.md). This document is for people who want to add features or change behavior.

## The whole app in eight bullets

* **Single file.** Everything lives in [`index.html`](index.html) — HTML, CSS, JS. No build step, no modules. Open it via `file://` and it works.
* **Repo detection cascade** (`detectRepo`, section 9): URL params → cached repo in localStorage → `*.github.io` hostname → `.git/config` (file:// only) → `CONFIG_DEFAULTS` fallback → manual form.
* **Tree fetch** (`fetchTree`, section 21): one call to GitHub's `/git/trees/<branch>?recursive=1`. Result is stored on `state.tree` as a flat array; `buildNestedTree` (section 17) folds it into a nested object for rendering.
* **Render pipeline** (`selectFile`, section 36): looks up the file in `state.tree`, picks a renderer by extension, and calls one of the `render*` helpers (Markdown / HTML / SVG / image / audio / video / PDF / spreadsheet / code).
* **Abort flow.** A single `currentAbortController` is held module-wide. Any new `fetchTree` or `selectFile` aborts the previous in-flight fetch. Every fetch passes the signal; AbortError is silently swallowed by the catch.
* **Local-first.** If the app is opened next to a checked-out copy (file:// or http on a local server), `probeLocalMode` (section 33b) tries fetching a small file directly. If that succeeds, `localBase` is set and subsequent fetches skip the GitHub API.
* **Caching.** Two caches: an LRU in-memory `fileTextCache` for text files (section 6), debounced-persisted to localStorage; and `activeBlobUrls`, a Set of object URLs revoked on file change and on `beforeunload`.
* **State storage.** All preferences (dark mode, font size, sidebar width, view toggles, last-opened file, repo detection, file-text cache) live in `localStorage` under `${CONFIG.storagePrefix}:${pathname}:*` keys. The GitHub token is the lone exception — it's stored under `githubToken`, un-prefixed, so multiple TooToo instances on the same origin share it.

## Read these in order

1. **`init`** (section 39) — the bottom of the script. Walks through every step in the order they happen.
2. **`detectRepo`** (section 9) — the cascade.
3. **`fetchTree`** (section 21) and **`renderTree`** (section 20) — how the sidebar gets built.
4. **`selectFile`** (section 36) — the dispatcher that picks a renderer.
5. The `render*` family (sections 33a–33b) — one function per file type.
6. **`fetchFileText`** / **`fetchFileBlob`** (sections 34, 35) — local-first → cache → API.

The numbered comment headers (`/* ── 1. Utility ── */` etc.) match this order. Skim them first.

## Adding a new file-type renderer

Three edits, no surprises:

1. Decide which constant array the extension belongs in. New binary type? Add to `STREAMABLE_EXTS` (section 3). Text-shaped? Don't add to anything — `selectFile` falls through to `renderCode`.
2. Write a `render<Whatever>(...)` helper alongside the existing ones (section 33). Render into `document.getElementById('contentBody')`. Run `DOMPurify.sanitize` on any HTML you didn't author yourself.
3. Add an `else if (ext === 'whatever')` branch in `selectFile` (section 36) that calls your renderer.

If your renderer needs a Rendered/Raw toggle, look at how `renderMarkdown` and `renderHtml` use `viewRendered` / `viewRaw` IDs — `setupContentActions` (section 37) wires the toggle from those IDs alone.

## Adding a header or file-action button

Header buttons (top-right): add a `<button>` to `<header>` in HTML, then attach a listener in `setupListeners` (section 12). Match the existing pattern — most just rebuild `contentBody` with a form.

Per-file action buttons (Rendered / Raw / Copy / New Tab): emit them from `buildFileHeader` (section 32), then handle the `data-action="..."` click inside `setupContentActions` (section 37). Event delegation means you don't add new listeners.

## CDN dependencies

| Library | Used for | Notes |
| --- | --- | --- |
| [marked](https://marked.js.org) | Markdown → HTML | Output is always passed through DOMPurify. Pinned to `12.0.2` because `18.x` reorganized the package layout and broke `/marked.min.js`. |
| [highlight.js](https://highlightjs.org) | Code syntax highlighting | Also loads a theme stylesheet — light/dark swap happens in `setHljsTheme`. |
| [DOMPurify](https://github.com/cure53/DOMPurify) | HTML sanitization | Wraps every `marked.parse` and every `XLSX.utils.sheet_to_html` call. Don't render untrusted HTML without it. |
| [SheetJS](https://sheetjs.com) | xlsx / xls / csv / ods rendering | Heaviest dep. If you don't need spreadsheets, delete `renderSpreadsheet` and the `<script src="...xlsx...">` tag and save ~700 KB. |

To swap a CDN for a local copy, download the file into your fork and point the `<script>`/`<link>` tags at the relative path. Everything still works under `file://`.

## Things that will bite you

* **`file://` and CORS.** Chrome blocks `fetch()` of local files unless you launch with `--allow-file-access-from-files`. Other browsers don't have an equivalent flag. If your fork must support a default Chrome install, it'll need a local web server.
* **Anonymous rate limit.** Without a token, GitHub allows 60 API requests per hour per IP. Tree + file fetches eat through that fast. Encourage forkers to set a token via the ⚙️ button.
* **GitHub Pages probe is best-effort.** `getNewTabUrl` (section 31) hits `/repos/<owner>/<repo>/pages` once. Custom domains and orgs with restrictive Pages settings can return 404 even when Pages is live; the New-Tab button falls back to the raw URL in that case.
* **Abort cascade.** Any code that fetches must accept and forward `signal`. If you add a new renderer that does its own fetch and forgets to pass the signal, fast clicking between files will leak in-flight requests.
* **`pathname`-scoped storage.** Two TooToo instances at different paths on the same origin (e.g. `/tootoo/` and `/tootoo-test/`) keep separate state but share the GitHub token. If your fork wants fully isolated state, change `CONFIG.storagePrefix`.
* **Tree truncation.** GitHub's recursive tree endpoint truncates at ~100k entries. `fetchTree` shows a warning banner when this happens but doesn't paginate.
* **Inline blob URLs leak under reload.** They're tracked in `activeBlobUrls` and revoked on `beforeunload`, but a hard navigation (e.g. typing a new URL in the address bar before unload fires) leaves them dangling until tab close.

## Project conventions

* **Vanilla JS only.** No frameworks, no build step. ES2020+ syntax is fine.
* **Functional style.** No classes, no `this`, no `var`. `const` over `let`. Arrow functions everywhere.
* **CSS custom properties** in `:root`, dark-mode overrides in `body.dark-mode`. No `!important` except on `.is-hidden`.
* **`escapeHTML` everything user-controlled** that goes into a template literal. Or use `textContent`.
* **One file.** If you need an external file, you're probably leaving the spirit of the project. Talk yourself out of it first.
