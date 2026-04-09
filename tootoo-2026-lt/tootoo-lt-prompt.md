# TooToo LT — Single-Repo Browser Prompt

## What This Is

TooToo LT is a single-file HTML GitHub browser that displays the file tree and file contents for **one repository on its default branch**.

Output: a single `tootoo-lt.html` file (~1500 lines of HTML/CSS/JS).

It is designed to be **dropped into any GitHub repo folder** and auto-detect its repository from `.git/config`. It also runs on GitHub Pages.

## Deployment

TooToo LT is a single `index.html` with an inline `CONFIG` object. Each copy differs only in its CONFIG values (or uses empty CONFIG for auto-detect). Apply fixes to all copies.

- **Drop-in mode**: Place `tootoo-lt.html` in any repo folder. Leave CONFIG empty — it auto-detects the repo from `.git/config`.
- **Pre-configured mode**: Set `CONFIG.owner` and `CONFIG.repo` for known repos.
- **GitHub Pages**: Works at `theo-armour.github.io/sandbox/tootoo/tootoo-lt/` (uses auto-detect or localStorage cache).

## Hard Constraints

- **Single file**: Everything in one `tootoo-lt.html` — HTML, CSS, JS inline
- **Vanilla JS only**: No frameworks, no jQuery, no build tools, no Node.js
- **ES2020+ features**: `const`/`let` (no `var`), arrow functions, template literals, async/await, optional chaining
- **Functional style**: No classes, no `this` keyword
- **Static hosting**: Must work on GitHub Pages and by opening the file locally
- **External deps (CDN)**: marked (latest via jsdelivr), highlight.js 11.9.0 (cdnjs), DOMPurify 3.x (jsdelivr), SheetJS xlsx-latest (cdn.sheetjs.com)
- **Security**: All user-supplied strings escaped via `escapeHTML()` / `escapeAttribute()` before insertion into DOM
- **Tooltips**: Every button must have a `title` attribute with a relevant tooltip
- **Beginner-readable**: If a student can't follow it, simplify

---

## CONFIG & Auto-Detection

```js
const CONFIG = {
  owner: '',   // empty = auto-detect from .git/config or prompt user
  repo: '',    // empty = auto-detect from .git/config or prompt user
  branch: '',  // empty = auto-detect default branch from API
};
```

### `detectRepo()` Cascade

When CONFIG has empty `owner`/`repo`, the app runs a detection cascade (returns a Promise):

1. **URL query parameters** → `?owner=X&repo=Y&branch=Z` merged into CONFIG
2. **CONFIG pre-filled** → use directly, call `updateHeaderFromConfig()`
3. **localStorage cache** → read `storageKey('repo')` JSON (`{owner, repo}`) — checked before `.git/config` to avoid noisy 404 console errors
4. **Fetch `.git/config`** → parse `github.com[:/]owner/repo` from remote URL → cache to localStorage
5. **Show inline form** → user enters owner + repo manually → saved to localStorage

`updateHeaderFromConfig()` dynamically sets:
- `document.title` → `"owner / repo"`
- `#headerTitle` text → `"owner / repo"`
- `#headerGitHub` href → `https://github.com/owner/repo`

---

## Architecture & Layout

### Application State

A single `state` object tracks everything:

```js
const state = {
  owner: '',           // current GitHub user/org
  repo: '',            // current repo name
  branch: '',          // current branch (resolved from API or CONFIG)
  tree: [],            // array of tree items from API
  currentFilePath: '', // path of file shown in content area
};
```

- GitHub token stored in `localStorage` under key `githubToken`
- A single `AbortController` (`mainAbortController`) cancels in-flight fetches when a new action starts

### HTML Structure

```
<body>
  <header>
    GitHub logo link (#headerGitHub, opens repo on GitHub, dynamically set) — leftmost element
    Title (#headerTitle, clickable → resetToHome(), dynamically set to "owner / repo")
    Dark mode toggle button (🌙/☀️, right-aligned)
    Font size decrease button ("A−", decreases by 2px, min 10px)
    Font size increase button ("A+", increases by 2px, max 28px)
    Token button ("⚙️ Token")
    Rate limit status badge (#rateLimitStatus, hidden until first API response)
  </header>

  <main>  (flex row, fills viewport below header)
    <div class="sidebar">
      <div id="navTree">
        <div>  (flex row)
          <h3>Files</h3>  (tooltip shows "Last updated: ..." read from meta[name=revised])
          Expand/Collapse All button (right-aligned, hidden until tree loads)
        </div>
        <input id="treeFilter">  (filter files by name/path)
        <div id="treeTruncatedWarning">  (hidden by default)
        <div id="treeList">
      </div>
    </div>

    <div class="resizer" id="dragMe">  (draggable column separator)
    </div>

    <div class="content-area" id="mainContent">
      (dynamic content — file viewer, welcome message, or repo config form)
    </div>
    <button class="back-to-top" id="btnBackToTop">  (fixed bottom-right, shown when content scrolls past 400px)
  </main>
</body>
```

### CSS Architecture

- CSS custom properties for theming: `--primary-bg`, `--secondary-bg`, `--text-color`, `--border-color`, `--highlight-color`, `--hover-bg`, `--font-family`
- **Dark mode**: `body.dark-mode` class overrides all custom properties; toggled via header button; persisted to `localStorage` under `darkMode`; also swaps highlight.js theme between `github.min.css` (light) and `github-dark.min.css` (dark) via `setHljsTheme()`
- `body` is a flex column filling `100vh`
- `main` is a flex row filling remaining space
- Sidebar has a CSS variable `--sidebar-width` (default 300px), updated by the drag resizer
- Content area has `min-width: 0` to allow flex shrinking
- Sidebar uses `overflow: hidden` with an internal flex layout; `#navTree` is a flex column and `#treeList` scrolls independently (`overflow-y: auto`), keeping the "Files" heading and filter input pinned at the top
- Content area scrolls independently (`overflow-y: auto`) with no top padding (padding: `0 1rem 1rem 1rem`)
- **Readability max-width**: `.markdown-body` and `pre` capped at `700px`; images, iframes, tables, and media remain full-width

### Responsive / Mobile

- `@media (max-width: 768px)` breakpoint:
  - Sidebar shrinks to `25%` width (overrides saved width via `!important`)
  - Sidebar padding reduced
  - File sizes hidden in tree (`.tree-item-size { display: none }`)
  - Resizer narrowed to 4px
  - File header stacks vertically (`flex-direction: column`)
  - Header wraps if needed

### Resizable Sidebar

- A `.resizer` div (8px wide) sits between sidebar and content, using `var(--highlight-color)` at 0.7 opacity (full opacity on hover/drag)
- Pointer events (pointerdown/pointermove/pointerup) handle drag resizing
- Uses `setPointerCapture` for reliable cross-element dragging
- Applies `user-select: none` and `cursor: col-resize` during drag
- Visual feedback: resizer highlights blue on hover and during resize
- **Width persisted** to `localStorage` under `sidebarWidth` and restored on load
- On mobile (≤768px), resizer narrows to 4px

### Event Delegation

- `treeList` uses event delegation for `data-action="select-file"` clicks
- Global `keydown` listener handles tree keyboard navigation

### Error Handling

- All fetch operations wrapped in try/catch
- AbortError silently ignored (expected when canceling)
- 403 errors append rate-limit hint
- Global `window.error` and `unhandledrejection` handlers show a styled error panel with reload button
- `beforeunload` handler revokes all blob URLs (from iframes, images, audio, video) to free memory
- HTML escaping via `escapeHTML()` and `escapeAttribute()` prevents XSS

---

## GitHub API Interactions

### Authentication

- Optional GitHub Personal Access Token for higher rate limits and private repo access
- Stored in `localStorage` under `githubToken`
- Sent as `Authorization: token <value>` header on all API requests
- Token UI: "⚙️ Token" button opens a `prompt()` dialog; blank clears the token; page reloads after change

### Loading the Repository Tree

Triggered automatically on page load (or by hash change):

1. Read `owner` and `repo` from CONFIG (filled by `detectRepo()`)
2. If `state.branch` is empty (no CONFIG override and not yet fetched):
   - Fetch `GET /repos/{owner}/{repo}` to get `default_branch`
   - If 404 without token: show private repo message with token prompt
   - If 404 with token: show "not found / bad token" message
   - Set `state.branch` to the response's `default_branch`
   - Branch is cached in `state.branch` across subsequent `loadRepo()` calls (but `state.tree` is intentionally cleared by `resetToHome()` to fetch the latest contents)
3. Fetch tree: `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`
4. If `treeData.truncated` is true, show the yellow warning banner
5. Store `treeData.tree` in `state.tree`
6. Render the tree in the sidebar
7. Auto-open `README.md` (case-insensitive, also matches `readme.txt`) in the content area

### Fetching File Content

- **With token** (private repos): `https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}` with `Accept: application/vnd.github.raw+json` header
- **Without token** (public repos): `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`
- Media files (images, audio, video, PDF) use blob-fetch when `ghToken` is set; otherwise direct URL
- The full fetch options (including `Authorization` header and abort signal) are passed to `loadFileContent()`
- Large files (>1MB): show a `window.confirm()` dialog before loading
- Approved large files tracked in an in-memory `Set` (per session)
- Files over 500KB skip syntax highlighting to avoid freezing the browser

### File Text Cache

- LRU in-memory cache (`fileTextCache` Map) backed by localStorage
- Cache key: `owner/repo/branch/path`
- Limit: 25 entries, max 300K characters per entry
- On hit, entry is moved to end (LRU refresh); on eviction, oldest entry removed
- Persisted to per-instance localStorage under `storageKey('fileTextCache')`
- Prevents redundant API calls when revisiting files or arrow-navigating the tree

### Rate Limiting

- 403 errors include a hint to add a token
- All fetches share a single `AbortController` — starting a new action cancels any in-flight request
- **Rate limit status** displayed in header: `API remaining/limit, resets HH:MM` — updated after every API response via `updateRateLimitStatus()`

---

## File Content Viewer

### File Type Handling

| Extension | Rendering |
|-----------|-----------|
| `.md` | Rendered via `marked.js` into `.markdown-body` div; raw toggle available; internal links rewritten |
| `.html`, `.htm` | Fetched, converted to Blob URL, embedded in `<iframe sandbox="allow-scripts">`; raw toggle; "New Tab" opens GitHub Pages URL |
| Code/text | `<pre><code>` with `highlight.js` syntax highlighting |
| `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.ico` | With token: fetched as blob via API, displayed via blob URL. Without token: inline `<img>`. SVG also offers raw toggle |
| `.mp3`, `.wav`, `.ogg` | With token: fetched as blob via API, blob URL in `<audio>`. Without token: direct URL. HTML5 player |
| `.mp4`, `.webm` | With token: fetched as blob via API, blob URL in `<video>`. Without token: direct URL. HTML5 player |
| `.pdf` | With token: fetched as blob via API, displayed in iframe with blob URL. Without token: Google Docs Viewer in iframe |
| `.xlsx`, `.xls`, `.csv`, `.ods` | Parsed with SheetJS (`XLSX.read`), each sheet rendered as an HTML table with sheet name heading; output sanitized via DOMPurify |
| Other | `<pre>` block (plain text) |

### Markdown Link Rewriting

- GitHub blob links → navigate within the app
- Relative paths → resolved against current file's directory
- External links → `target="_blank" rel="noopener"`
- If `marked.parse()` throws, show error banner + raw fallback

### Large File Protection

- Threshold: `LARGE_FILE_WARNING_BYTES = 1024 * 1024` (1 MB)
- Files exceeding threshold trigger a `window.confirm()` dialog
- **Streamable files skip the prompt**: images (`png`, `jpg`, `jpeg`, `gif`, `webp`, `svg`, `ico`), audio (`mp3`, `wav`, `ogg`), video (`mp4`, `webm`), and `pdf` load without confirmation regardless of size
- Approved files tracked in `approvedLargeFiles` Set (per session)
- File size read from tree API response (`item.size`)
- Files over 500KB skip syntax highlighting to avoid freezing the browser

### File Header Details

- GitHub icon appears first (leftmost), linking to the file on GitHub
- Repo name is a clickable link that calls `resetToHome()` — clears lastFilePath, clears hash, reloads tree
- **Breadcrumb folder navigation**: intermediate path segments are clickable links that scroll to and expand the corresponding folder in the tree via `scrollToTreeFolder()`, which queries by `data-folder-path` attribute for reliable matching (even with same-named folders at different depths)
- "Copy" button copies raw file content to clipboard (shows "✓ Copied" feedback for 1.5s); hidden for binary file types (images, audio, video, PDF, spreadsheets)
- "New Tab" button opens GitHub Pages URL: `https://{owner}.github.io/{repo}/{path}`
- **User page detection**: if repo name matches `{owner}.github.io`, the "New Tab" URL omits the repo segment: `https://{owner}.github.io/{path}`

### Rendered ↔ Raw Toggle

- Two-button toggle: "Rendered" and "Raw"
- Active button full opacity, inactive 0.5 opacity
- Toggles `display` on `#viewRendered` / `#viewRaw`
- Only shown for file types with both views (markdown, HTML, SVG)
- **View preference persisted** per file type in localStorage under `storageKey('viewPref:{ext}')` — restored when opening another file of the same type

---

## Navigation & Tree

### Hash-Based Routing

Simplified format: `#{filepath}`

Hash contains **only the file path** (no owner/repo prefix). The repo is already known from CONFIG/auto-detect.

Examples:
- `#README.md` → open README.md
- `#tootoo/index.html` → open the file at that path
- (no hash) → auto-open README or show welcome

### `resetToHome()`

Called by clicking the header title or the repo breadcrumb link in file headers:
1. Removes `lastFilePath` from localStorage
2. Clears `state.currentFilePath`
3. Clears `state.tree` to force a fresh API fetch of the latest repository contents
4. Strips the hash from the URL via `history.replaceState` (best-effort, fails silently on `file://`)
5. Calls `loadRepo(false)` to re-fetch tree from API, re-render sidebar, and auto-open README

### Hash Behavior
- `updateHash()`: When a file is selected, pushes `#filepath` via `history.pushState`. When no file is selected, strips the hash via `history.replaceState` (never pushes bare `#`)
- Hash **not** set for auto-displayed READMEs on initial load
- `popstate` and `hashchange` events trigger `handleHashChange()`
- Deep linking: on page load, if hash present, parse filepath from it and navigate

### Tree Rendering

- `renderTree()` builds a nested object from flat tree paths, then generates HTML
- **Filtered out**: folders starting with `.` (and their contents)
- **Shared item builder**: `buildItemHtml(key, child)` generates HTML for a single folder or file item; used by both `buildHtml` (nested recursive render) and `renderNextBatch` (batched root-level render) to avoid code duplication
- **Batched rendering**: root-level items rendered in chunks of `TREE_RENDER_BATCH_SIZE` (120) via `setTimeout(0)` to avoid blocking the UI; a progress indicator (`treeRenderStatus`) shows percentage during render
- Folders rendered as `<details data-folder-path="{path}"><summary>` elements (native collapsible); the `data-folder-path` attribute stores the full folder path for programmatic lookup
- Files rendered as `<div class="tree-item">` with `data-action="select-file"` and `data-path`
- Folders sorted before files, then alphabetically within each group
- **File type icons**: distinct emoji per extension (📝 md, 🟨 js, 🟦 ts, 🐍 py, 🌐 html, 🎨 css, 🖼️ images, 🎵 audio, 🎬 video, 📕 pdf, 📊 spreadsheets, ⚙️ yaml, 📦 archives, `{ }` json, 📄 default)
- **README files bolded** in tree for visibility
- File sizes shown right-aligned in a `.tree-item-size` span
- Monospace font for tree items

### Tree Filter

- Text input (`#treeFilter`) above the tree list
- Filters `.tree-item` elements by matching `data-path` against the query (case-insensitive)
- Hides `<details>` folders that have no visible children
- Auto-expands folders with matching files when query is active

### Expand All / Collapse All

- Toggle button next to "Files" heading in sidebar (right-aligned)
- Sets/removes `open` attribute on all `<details>` elements
- Button text switches between "Expand All" and "Collapse All"

### Auto-Open README

- When the repo tree loads, auto-open `README.md` (case-insensitive, also matches `readme.txt`)
- Uses `state.tree.find()` on the flat tree array

---

## Keyboard Navigation

Global `keydown` listener on `document`, active only when focus is on a `.tree-folder` or `.tree-item`:

| Key | Action |
|-----|--------|
| Arrow Down | Focus next visible tree item; auto-loads file content (cached after first fetch) |
| Arrow Up | Focus previous visible tree item; auto-loads file content (cached after first fetch) |
| Enter / Space | Activate focused item (click file, toggle folder) |
| Arrow Right | Expand focused folder (if collapsed); move into first child (if expanded) |
| Arrow Left | Collapse focused folder (if expanded); move to parent folder (if collapsed or file) |

- "Visible items" = all `.tree-folder` and `.tree-item` elements that are not inside a closed `<details>`
- Items have `tabindex="0"` for focusability
- `e.preventDefault()` applied to prevent page scroll
- **`/` shortcut**: pressing `/` (when not in an input) focuses `#treeFilter`

### Back-to-Top Button

- Fixed `position: fixed` button at bottom-right of viewport
- Appears when `#mainContent` scrolls past 400px
- Smooth-scrolls `#mainContent` to top on click

---

## localStorage Keys

| Key | Scope | Purpose |
|-----|-------|---------|
| `githubToken` | Global | GitHub Personal Access Token |
| `darkMode` | Global | `'true'` or `'false'` — dark mode state |
| `sidebarWidth` | Global | Pixel width of sidebar (number as string) |
| `fontSize` | Global | Font size in pixels (number as string, default 16) |
| `tootoo-lt:{pathname}:repo` | Per-instance | Cached `{owner, repo}` JSON from auto-detect |
| `tootoo-lt:{pathname}:lastFilePath` | Per-instance | Path of last viewed file (reopened on load if no hash) |
| `tootoo-lt:{pathname}:fileTextCache` | Per-instance | JSON array of `[key, text]` pairs for LRU file text cache |
| `tootoo-lt:{pathname}:viewPref:{ext}` | Per-instance | `'rendered'` or `'raw'` — last toggle choice per file type |

Per-instance keys use `storageKey(suffix)` which namespaces by `location.pathname`, so multiple TooToo LT copies in different folders don't interfere.

---

## Init Sequence

```
1. Restore sidebar width from localStorage
2. Restore dark mode from localStorage
3. Run detectRepo() — cascade: URL query params → CONFIG → localStorage → .git/config → show form
4. Set state.owner, state.repo, state.branch from CONFIG
5. If URL hash present and not bare '#' → handleHashChange() → parse filepath, load tree if needed, open file
6. Else if lastFilePath in per-instance localStorage → loadRepo(false) then open that file
7. Else → loadRepo() → fetches default branch (if needed), tree, renders sidebar, auto-opens README.md
```

