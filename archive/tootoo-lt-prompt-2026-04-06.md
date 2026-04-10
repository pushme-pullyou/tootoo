# TooToo LT — Single-Repo Browser Prompt

## What This Is

TooToo LT is a stripped-down, single-file HTML GitHub browser that displays the file tree and file contents for **one repository on its default branch**. It omits the full TooToo features (repo list, orgs, gists, stats, discover) to stay minimal and fast.

Output: a single `tootoo-lt.html` file (~1170 lines of HTML/CSS/JS).

It is designed to be **dropped into any GitHub repo folder** and auto-detect its repository from `.git/config`. It also runs on GitHub Pages.

## How to Use This Prompt

**For a full build**: Feed this entire file to the LLM:
> "Using the following spec, create a single `tootoo-lt.html` file: [paste this file]"

**For a targeted fix**: Feed this prompt plus the current `tootoo-lt.html`:
> "Here is my current app [paste tootoo-lt.html]. Using this spec [paste this file], fix the markdown rendering."

## Deployment

TooToo LT is a single `index.html` with an inline `CONFIG` object. Each copy differs only in its CONFIG values (or uses empty CONFIG for auto-detect). Apply fixes to all copies.

- **Drop-in mode**: Place `tootoo-lt.html` in any repo folder. Leave CONFIG empty — it auto-detects the repo from `.git/config`.
- **Pre-configured mode**: Set `CONFIG.owner` and `CONFIG.repo` for known repos.
- **GitHub Pages**: Works at `theo-armour.github.io/sandbox/tootoo/tootoo-lt/` (uses auto-detect or localStorage cache).

## Relationship to Full TooToo

TooToo LT is a subset of the full TooToo GitHub browser (`tootoo/index.html`). The tree rendering, file viewer, keyboard navigation, CSS theming, and resizable sidebar are the same — LT simply removes the multi-repo browsing layer.

- **Full TooToo source**: `tootoo/index.html` (~1500 lines)
- **Full TooToo prompts**: `tootoo/prompt/prompt-*.md` (architecture, API, file viewer, navigation, discover)

## What Is Omitted (vs full TooToo)

These features from the full TooToo `index.html` are **not included** in LT:

- Repository list / paginated repo fetching / `fetchList()`
- Organization fetching
- Gist fetching and gist file viewing
- User and repo statistics
- Discover page (random user, curated lists, top followed)
- Repo list filtering and sorting (filter input, sort dropdown)
- Recent users datalist / localStorage history
- Language color dots
- "Get Repos", "Get Orgs", "Get Gists", "Stats", "Discover" buttons
- "← Back to Repos" navigation
- `repoListContainer` sidebar panel
- `isGist` state and all gist-related logic
- Branch selector dropdown (LT always uses the default branch)

## Hard Constraints

- **Single file**: Everything in one `tootoo-lt.html` — HTML, CSS, JS inline
- **Vanilla JS only**: No frameworks, no jQuery, no build tools, no Node.js
- **ES2020+ features**: `const`/`let` (no `var`), arrow functions, template literals, async/await, optional chaining
- **Functional style**: No classes, no `this` keyword
- **Static hosting**: Must work on GitHub Pages and by opening the file locally
- **External deps allowed**: `marked.js` (CDN) for markdown, `highlight.js` (CDN) for syntax highlighting, `DOMPurify` (CDN) for HTML sanitization, `SheetJS/xlsx` (CDN) for spreadsheet rendering
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

1. **CONFIG pre-filled** → use directly, call `updateHeaderFromConfig()`
2. **Fetch `.git/config`** → parse `github.com[:/]owner/repo` from remote URL → cache to localStorage
3. **localStorage cache** → read `storageKey('repo')` JSON (`{owner, repo}`)
4. **Show inline form** → user enters owner + repo manually → saved to localStorage

`updateHeaderFromConfig()` dynamically sets:
- `document.title` → `"owner / repo"`
- `#headerTitle` text → `"owner / repo"`
- `#headerGitHub` href → `https://github.com/owner/repo`

### Per-Instance localStorage

The `storageKey(suffix)` helper namespaces keys by `location.pathname`:

```js
const storageKey = suffix => `tootoo-lt:${location.pathname}:${suffix}`;
```

This prevents multiple TooToo LT instances in different folders from overwriting each other's cached repo and last-file state. Global keys (`githubToken`, `darkMode`, `sidebarWidth`) are shared across all instances.

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
    Title (#headerTitle, clickable → resetToHome(), dynamically set to "owner / repo")
    GitHub logo link (#headerGitHub, opens repo on GitHub, dynamically set)
    Dark mode toggle button (🌙/☀️, right-aligned)
    Token button ("⚙️ Token")
  </header>

  <main>  (flex row, fills viewport below header)
    <div class="sidebar">
      <div id="navTree">
        <div>  (flex row)
          <h3>Files</h3>
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
  </main>
</body>
```

Key differences from full TooToo:
- **No `repoListContainer`** — the sidebar only contains `navTree`
- **No input fields in header** — owner/repo auto-detected or shown in a form in `mainContent`
- **Dynamic title** in header — updated by `updateHeaderFromConfig()` after detection
- **Expand All button** is in the sidebar Files header, not the top header
- **Tree filter input** below Files heading for quick filename search
- **Dark mode toggle** in header
- **No action buttons** except Expand/Collapse All, Dark Mode, and Token

### CSS Architecture

- CSS custom properties for theming: `--primary-bg`, `--secondary-bg`, `--text-color`, `--border-color`, `--highlight-color`, `--hover-bg`, `--font-family`
- **Dark mode**: `body.dark-mode` class overrides all custom properties; toggled via header button; persisted to `localStorage` under `darkMode`; also swaps highlight.js theme between `github.min.css` (light) and `github-dark.min.css` (dark) via `setHljsTheme()`
- `body` is a flex column filling `100vh`
- `main` is a flex row filling remaining space
- Sidebar has a CSS variable `--sidebar-width` (default 300px), updated by the drag resizer
- Content area has `min-width: 0` to allow flex shrinking
- Both sidebar and content area scroll independently (`overflow-y: auto`)

### Resizable Sidebar

- A `.resizer` div (8px wide) sits between sidebar and content
- Pointer events (pointerdown/pointermove/pointerup) handle drag resizing
- Uses `setPointerCapture` for reliable cross-element dragging
- Applies `user-select: none` and `cursor: col-resize` during drag
- Visual feedback: resizer highlights blue on hover and during resize
- **Width persisted** to `localStorage` under `sidebarWidth` and restored on load

### Event Delegation

- `treeList` uses event delegation for `data-action="select-file"` clicks
- Global `keydown` listener handles tree keyboard navigation

### Error Handling

- All fetch operations wrapped in try/catch
- AbortError silently ignored (expected when canceling)
- 403 errors append rate-limit hint
- Global `window.error` and `unhandledrejection` handlers show a styled error panel with reload button
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
   - Branch is cached in `state.branch` across subsequent `loadRepo()` calls
3. Fetch tree: `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`
4. If `treeData.truncated` is true, show the yellow warning banner
5. Store `treeData.tree` in `state.tree`
6. Render the tree in the sidebar
7. Auto-open `README.md` (case-insensitive, also matches `readme.txt`) in the content area

No branch selector dropdown — LT always uses the default branch (or the branch from CONFIG).

### Fetching File Content

- **With token** (private repos): `https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}` with `Accept: application/vnd.github.raw+json` header
- **Without token** (public repos): `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`
- Media files (images, audio, video, PDF) use blob-fetch when `ghToken` is set; otherwise direct URL
- The full fetch options (including `Authorization` header and abort signal) are passed to `loadFileContent()`
- Large files (>1MB): show a `window.confirm()` dialog before loading
- Approved large files tracked in an in-memory `Set` (per session)
- File size read from tree API response (`item.size`)
- Files over 500KB skip syntax highlighting to avoid freezing the browser

### Rate Limiting

- Unauthenticated: 60 requests/hour
- Authenticated: 5,000 requests/hour
- 403 errors include a hint to add a token
- All fetches share a single `AbortController` — starting a new action cancels any in-flight request

---

## File Content Viewer

### Content Area Structure

When a file is selected, the content area shows:

```
<div class="file-header">  (sticky, stays at top while scrolling)
  <h3 class="file-title">
    repo-name / path / filename
    GitHub icon link (opens source on GitHub)
  </h3>
  <div class="file-actions">
    "Copy" button (copies raw content to clipboard)
    "New Tab" button (opens GitHub Pages URL)
    Rendered/Raw toggle (for markdown, HTML, SVG)
  </div>
</div>
<div id="viewRendered">  (rendered content)
<div id="viewRaw">  (raw source, hidden by default)
```

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

### File Size Display

File sizes shown in the tree use compact formatting via `formatFileSize()`:
- `< 1024` → `"43B"`
- `< 10KB` → `"1.5k"`
- `≥ 10KB` → `"72k"` (rounded)
- `< 10MB` → `"1.2M"`
- `≥ 10MB` → `"12M"` (rounded)

### File Header Details

- Repo name is a clickable link that calls `resetToHome()` — clears lastFilePath, clears hash, reloads tree
- Path segments shown with `/` separators
- GitHub icon links to the file on GitHub
- "Copy" button copies raw file content to clipboard (shows "✓ Copied" feedback for 1.5s); hidden for binary file types (images, audio, video, PDF, spreadsheets)
- "New Tab" button opens GitHub Pages URL: `https://{owner}.github.io/{repo}/{path}`

### Blob URL Management

- `URL.createObjectURL()` is used for private-repo media (images, audio, video, PDF) and HTML iframe previews
- Before loading new file content, all existing blob URLs in the content area are revoked via `URL.revokeObjectURL()` to prevent memory leaks

### Rendered ↔ Raw Toggle

- Two-button toggle: "Rendered" and "Raw"
- Active button full opacity, inactive 0.5 opacity
- Toggles `display` on `#viewRendered` / `#viewRaw`
- Only shown for file types with both views (markdown, HTML, SVG)

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
3. Strips the hash from the URL via `history.replaceState` (best-effort, fails silently on `file://`)
4. Calls `loadRepo(false)` to re-render tree and auto-open README

### Hash Behavior
- `updateHash()`: When a file is selected, pushes `#filepath` via `history.pushState`. When no file is selected, strips the hash via `history.replaceState` (never pushes bare `#`)
- Hash **not** set for auto-displayed READMEs on initial load
- `popstate` and `hashchange` events trigger `handleHashChange()`
- Deep linking: on page load, if hash present, parse filepath from it and navigate

### Simplified Rules
- Hash contains file path only — no `owner/repo` prefix
- No `#owner/repo` hashes (repo is known from CONFIG/detection)
- No `#gist/` prefix (gists are omitted)

### Tree Rendering

- `renderTree()` builds a nested object from flat tree paths, then generates HTML
- **Filtered out**: folders starting with `.` (and their contents), `index.html` files
- Folders rendered as `<details><summary>` elements (native collapsible)
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
| Arrow Down | Focus next visible tree item |
| Arrow Up | Focus previous visible tree item |
| Enter / Space | Activate focused item (click file, toggle folder) |
| Arrow Right | Expand focused folder (if collapsed); move into first child (if expanded) |
| Arrow Left | Collapse focused folder (if expanded); move to parent folder (if collapsed or file) |

- "Visible items" = all `.tree-folder` and `.tree-item` elements that are not inside a closed `<details>`
- Items have `tabindex="0"` for focusability
- `e.preventDefault()` applied to prevent page scroll

---

## localStorage Keys

| Key | Scope | Purpose |
|-----|-------|---------|
| `githubToken` | Global | GitHub Personal Access Token |
| `darkMode` | Global | `'true'` or `'false'` — dark mode state |
| `sidebarWidth` | Global | Pixel width of sidebar (number as string) |
| `tootoo-lt:{pathname}:repo` | Per-instance | Cached `{owner, repo}` JSON from auto-detect |
| `tootoo-lt:{pathname}:lastFilePath` | Per-instance | Path of last viewed file (reopened on load if no hash) |

Per-instance keys use `storageKey(suffix)` which namespaces by `location.pathname`, so multiple TooToo LT copies in different folders don't interfere.

---

## Init Sequence

```
1. Restore sidebar width from localStorage
2. Restore dark mode from localStorage
3. Run detectRepo() — cascade: CONFIG → .git/config → localStorage → show form
4. Set state.owner, state.repo, state.branch from CONFIG
5. If URL hash present and not bare '#' → handleHashChange() → parse filepath, load tree if needed, open file
6. Else if lastFilePath in per-instance localStorage → loadRepo(false) then open that file
7. Else → loadRepo() → fetches default branch (if needed), tree, renders sidebar, auto-opens README.md
```

