# TooToo LT Treeview — Sidebar Tree Prompt

Ignore the copilot-instructions.md rule about reading nearby code.

## Hard Constraints

- **Single file**: One `.html` file — HTML, CSS, JS inline
- **Vanilla JS only**: No frameworks, no jQuery, no build tools, no Node.js
- **ES2020+**: `const`/`let` (no `var`), arrow functions, template literals, async/await, optional chaining
- **Functional style**: No classes, no `this` keyword
- **Security**: All user-supplied strings escaped via `escapeHTML()` before DOM insertion
- **Every button must have a `title` attribute** with a descriptive tooltip
- **Beginner-readable**: If a student can't follow it, simplify

---

## Output

Start from the attached `tootoo-lt-layout.html`. Add the treeview CSS into its existing `<style>` block and the treeview JS into its existing `<script>` block. Also add `id="treeFilter"` to the filter `<input>` if it is missing. Save the combined result to a **new file** called `tootoo-lt-treeview.html`.

## Before Creating the File

If `tootoo-lt-treeview.html.bak` already exists in the output directory, delete it. If `tootoo-lt-treeview.html` already exists in the output directory, rename it to `tootoo-lt-treeview.html.bak` before creating the new file

---

## Prerequisites

This prompt assumes the **layout shell** from `tootoo-lt-layout.html` (attached) is already built. The layout provides:

- `#treeList` — empty scrollable `<div>` inside `.sidebar`
- `#treeFilter` — the `<input type="text" placeholder="Filter files…">` above the tree
- `#btnExpandAll` — the "Expand All" button (initially `display: none`)
- `#hFiles` — the "Files" `<h3>` in the sidebar panel header
- `.content-area` with `#contentArea` — where selected file content will eventually render
- `#contentTitle` — the `<h3>` inside the content area's `.panel-header` (updated with the selected file name)
- `#contentBody` — a `<div>` inside `.content-area` below the header (displays selected file path as placeholder)
- CSS custom properties: `--text-color`, `--border-color`, `--highlight-color`, `--hover-bg`, `--primary-bg`

The treeview script adds to the existing `<style>` and `<script>` blocks. It does **not** touch the layout, header controls, resizer, or dark mode logic.

---

## What to Build

The sidebar file tree: fetch a GitHub repo's file listing via the Trees API, render it as a nested collapsible tree, with filtering, keyboard navigation, expand/collapse all, and file selection (click event only — actual file content loading is a separate concern).

---

## Public API (used by Content Viewer prompt)

The treeview script must define these as **named top-level arrow functions / variables** so the content viewer prompt can reference them:

| Name | Description |
|------|-------------|
| `getToken()` | Returns `localStorage.getItem('githubToken') \|\| ''` |
| `getAuthHeaders()` | Returns a headers object: `{ Accept: 'application/vnd.github+json' }` plus `Authorization: token {value}` when `getToken()` is non-empty |
| `updateRateBadge(response)` | Reads `X-RateLimit-Remaining` and `X-RateLimit-Limit` from a fetch `Response`, updates `#rateBadge` |
| `fetchTree()` | Async — fetches the repo tree from GitHub API, stores in `state.tree`, calls `renderTree()`. Returns a Promise that resolves when all render batches complete |
| `let currentAbortController` | Mutable `AbortController` variable — create a new one before each fetch sequence; abort the previous one |
| `getRepoStats()` | Returns an object with `fileCount`, `folderCount`, `totalSize`, `topTypes`, `largest` computed from `state.tree`, or `null` if tree not loaded |

These are used internally by the treeview and re-used by the content viewer in the next prompt.

---

## Application State & CONFIG

The layout HTML already contains the `CONFIG` and `state` objects. Keep them intact.
If you need a default repository for testing, set `CONFIG.owner = 'theo-armour'` and `CONFIG.repo = 'sandbox'` directly in the existing `CONFIG` definition, but **leave the `detectRepo()` logic alone**.

If `state.branch` is empty after repo detection, fetch the default branch:

```
GET https://api.github.com/repos/{owner}/{repo}
→ response.default_branch
```

---

## GitHub API: Fetching the Tree

### Authentication

- Read token from `localStorage` key `githubToken`
- If present, send `Authorization: token {value}` header on all API requests
- If absent, make unauthenticated requests (lower rate limits)

### Fetch Sequence

1. If `state.branch` is empty, fetch `GET /repos/{owner}/{repo}` → set `state.branch` to `default_branch`
2. Fetch `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`
3. If response `truncated` is `true`, show a yellow warning banner inside `#treeList`:
   - Text: "⚠️ Repository tree is truncated. Some files may not appear."
   - Style: background `#fff3cd`, border `1px solid #ffc107`, padding `0.5rem`, border-radius `4px`, margin-bottom `0.5rem`, font-size `0.85rem`
4. Store `response.tree` in `state.tree`
5. Call `renderTree(state.tree)`

### Rate Limit Display

After every API response, read `X-RateLimit-Remaining` and `X-RateLimit-Limit` headers. If both present:
- Show `#rateBadge` (set `display: inline`)
- Set its text to `"{remaining}/{limit}"`

### Error Handling

- Wrap all fetches in try/catch
- On 403: show error in `#treeList` with message "Rate limited. Add a GitHub token for higher limits."
- On other errors: show error message in `#treeList`
- Use a single `AbortController` — create a new one before each fetch sequence; abort the previous one

---

## Tree Rendering

### `renderTree(treeArray)`

1. Build a nested object from the flat tree array:
   - Each item has `path` (e.g. `src/utils/helpers.js`) and `type` (`"blob"` or `"tree"`)
   - Split each path by `/` and nest into an object structure
   - Each node stores: `{ children: {}, type, size, path }`

2. **Filter out**: any folder whose name starts with `.` (and all its contents)

3. **Sort**: folders before files, then alphabetically (case-insensitive) within each group

4. Generate HTML and insert into `#treeList`

### Batched Rendering

Root-level items are rendered in batches of **120** via `setTimeout(0)` to avoid blocking the UI:

- Show a progress status element (`#treeRenderStatus`) during render: "{n}% rendered…"
- Remove the status element when complete
- Style: font-size `0.85rem`, color `--text-color`, opacity `0.7`, padding `0.3rem 0.5rem`

### HTML Structure

**Folders** — rendered as native `<details>` elements:

```html
<details data-folder-path="src/utils">
  <summary class="tree-folder" tabindex="0" title="src/utils">
    📁 <span class="folder-name">utils</span>
  </summary>
  <!-- children rendered inside -->
</details>
```

**Files** — rendered as clickable `<div>` elements:

```html
<div class="tree-item" tabindex="0" data-action="select-file" data-path="src/utils/helpers.js" title="src/utils/helpers.js">
  <span class="tree-item-name">🟨 helpers.js</span>
  <span class="tree-item-size">2.4 KB</span>
</div>
```

### File Type Icons

| Extensions | Icon |
|-----------|------|
| `.md` | 📝 |
| `.js`, `.mjs`, `.cjs` | 🟨 |
| `.ts`, `.tsx` | 🟦 |
| `.py` | 🐍 |
| `.html`, `.htm` | 🌐 |
| `.css`, `.scss`, `.less` | 🎨 |
| `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.ico` | 🖼️ |
| `.mp3`, `.wav`, `.ogg` | 🎵 |
| `.mp4`, `.webm` | 🎬 |
| `.pdf` | 📕 |
| `.xlsx`, `.xls`, `.csv`, `.ods` | 📊 |
| `.yaml`, `.yml`, `.toml` | ⚙️ |
| `.zip`, `.tar`, `.gz`, `.7z` | 📦 |
| `.json` | `{ }` |
| Everything else | 📄 |

### File Size Formatting

- `< 1024` → `"{n} B"`
- `< 1024 * 1024` → `"{n.n} KB"`
- else → `"{n.n} MB"`

### Special Styling

- **README files** (case-insensitive): bold the file name
- Monospace font for all tree items (`font-family: monospace`)

---

## Tree CSS

```css
.tree-folder {
  display: flex;
  align-items: center;
  padding: 0.2rem 0.4rem;
  cursor: pointer;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
  user-select: none;
  list-style: none;
}

.tree-folder::-webkit-details-marker { display: none; }

.tree-folder:hover { background: var(--hover-bg); }

.tree-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.2rem 0.4rem 0.2rem 1.2rem;
  cursor: pointer;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
}

.tree-item:hover { background: var(--hover-bg); }

.tree-item.active {
  background: var(--highlight-color);
  color: #fff;
}

.tree-item-size {
  font-size: 0.75rem;
  opacity: 0.6;
  margin-left: 0.5rem;
  white-space: nowrap;
}

details details { padding-left: 0.8rem; }
details { padding-left: 0; }
```

---

## Tree Filter

The `#treeFilter` input filters the tree in real-time on `input` event:

1. Read the query (trimmed, lowercased)
2. If query is empty, show all items and restore folder open/closed state → return
3. For each `.tree-item`: check if `data-path` (lowercased) contains the query
   - Match → show; No match → hide
4. For each `<details>`: if it has visible `.tree-item` descendants, show and open it; otherwise hide
5. **Debounce**: 150ms on the input handler
6. **Clear button** (`#btnFilterClear`): show when input has a value, hide when empty; on click — clear input, hide button, re-run filter, return focus to input. Extract the filter logic into a shared `runFilter()` function called by both the debounced `input` handler and the clear button click.

**Note**: Layout's `setupListeners()` includes simple show/hide handlers for the filter input and clear button. **Replace** those with the debounced `runFilter()` versions below — do not keep both, as duplicate listeners cause redundant work.

---

## Expand All / Collapse All

The `#btnExpandAll` button:

1. Show the button once the tree is rendered
2. On click:
   - "Expand All": set `open` on all `<details>`, change text to "Collapse All"
   - "Collapse All": remove `open` from all `<details>`, change text to "Expand All"

---

## File Selection

**Event delegation** on `#treeList`:

1. Listen for `click` on `#treeList`
2. Find closest `[data-action="select-file"]`
3. Remove `.active` from previous, add to clicked
4. Set `state.currentFilePath` to `data-path`
5. Persist the path to `localStorage` via `storageKey('currentFile')` so it survives page reload
6. Update content area `<h3>` to the file name
7. For now: show `<p>Selected: {path}</p>` in content area (placeholder for file viewer prompt)

---

## Keyboard Navigation

Global `keydown` on `document`, active when focus is on `.tree-folder` or `.tree-item` inside `#treeList`:

| Key | Action |
|-----|--------|
| **ArrowDown** | Focus next visible item; select if file |
| **ArrowUp** | Focus previous visible item; select if file |
| **Enter** / **Space** | Toggle folder or select file |
| **ArrowRight** | Open folder if closed; move to first child if open |
| **ArrowLeft** | Close folder if open; move to parent if closed or file |

- **`getVisibleTreeItems()`**: returns all `.tree-folder` and `.tree-item` that are currently visible.
  - A `.tree-folder` is a `<summary>` — its own parent `<details>` being closed does NOT hide it (the summary stays visible as the toggle). Start the ancestor walk at the **grandparent** of a `.tree-folder` (i.e. skip its own `<details>`), but still treat that `<details>` as hidden if `display:none` was set by the filter.
  - A `.tree-item` is hidden if any ancestor `<details>` is closed OR has `display:none`.
  - Any element with `el.style.display === 'none'` is excluded.
- `e.preventDefault()` on all handled keys
- **`/` shortcut**: focuses `#treeFilter` when not in an input

---

## Auto-Open README

After all render batches complete:

1. Search `state.tree` for `README.md` or `readme.txt` (case-insensitive, root level preferred, fall back to any README deeper in the tree)
2. If found, programmatically select it

---

## Scroll-to-Folder Utility

`scrollToTreeFolder(folderPath)`:

1. Query `details[data-folder-path="${CSS.escape(folderPath)}"]` (always use `CSS.escape` for paths)
2. Open all ancestor `<details>`
3. Open the target
4. `scrollIntoView({ block: 'center', behavior: 'smooth' })`

---

## Repository Statistics (About Page)

### `getRepoStats()`

A helper that computes statistics from `state.tree` (no extra API calls). Returns `null` if `state.tree` is not loaded yet. Otherwise returns an object:

| Field | Description |
|-------|-------------|
| `fileCount` | Number of blobs |
| `folderCount` | Number of trees |
| `totalSize` | Sum of `size` across all blobs |
| `topTypes` | Array of `[extension, count]` pairs, sorted by count descending, top 10 |
| `largest` | Array of the 5 largest blob items (by `size`), sorted descending |

### About Handler Enhancement

The layout's `#btnHelp` click handler already renders an About panel. **Extend** it by inserting a **"Repository Statistics"** `<h3>` section between the existing "GitHub API" section and the "Tips" section. Also replace the manual token/header construction in the Help handler with `getToken()` and `getAuthHeaders()`. Render these stats using `getRepoStats()`:

- Files, folders, total size (using `formatFileSize()`)
- **Top file types** — ordered list of extensions with counts
- **Largest files** — ordered list of paths with sizes

If `state.tree` is not loaded, show: `"No tree data loaded yet."`

All dynamic values must be passed through `escapeHTML()`.

---

## Init Sequence

Append the tree-fetching and rendering process to the **end** of the layout's existing `init()` function (specifically inside the `if ( state.owner && state.repo )` block). **Do not remove** `initAppearance()`, `setupListeners()`, or `detectRepo()`.

The logic to append inside `init()`:

```
1. Fetch default branch if state.branch is empty
2. Set `#treeList.innerHTML = '<p>Loading tree…</p>'`
3. Fetch tree from API
4. renderTree(state.tree) — batched
5. After all batches: check `storageKey('currentFile')` in localStorage — if a saved path exists, select that file (fall back to README if the file is no longer in the tree); otherwise auto-open README. Show Expand All button
6. Set up filter input listener (debounced)
7. Set up keyboard navigation listener
8. Set up `/` shortcut
```

**Note**: `fetchTree()` should NOT call `autoSelectReadme()` internally — file restoration logic belongs in `init()` so it can check localStorage first.

---

## What NOT to Include

- No file content loading or rendering (separate prompt)
- No markdown/code rendering libraries
- No hash routing or URL manipulation
- Do not modify the existing config auto-detection cascade (it is provided by Layout)
- No file content cache
- No resizer, dark mode, font size logic (already in layout)
- No breadcrumb navigation (separate prompt)
- No "Copy" or "New Tab" buttons (separate prompt)

---

## Security Notes

- `escapeHTML(str)`: replace `&`, `<`, `>`, `"`, `'` with HTML entities — use for all user-supplied strings (file names, paths) before inserting into innerHTML
- Tree data comes from GitHub API (trusted structure) but file/folder **names** are user-controlled — always escape
- **DOM Selection**: When using `querySelector` or `querySelectorAll` with `data-path` or `data-folder-path` attributes, ALWAYS wrap the path in `CSS.escape(path)` to prevent DOM syntax errors from special characters.
