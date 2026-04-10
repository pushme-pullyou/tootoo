# TooToo — Prompt Guide

## What This Is

TooToo is a single-file HTML GitHub browser. One `index.html`, zero build tools, vanilla JS only.
It runs on GitHub Pages at `theo-armour.github.io/sandbox/` and `theo-armour.github.io/sandbox/tootoo/`.

This prompt guide is split across multiple files so each concern can be iterated independently.

## Prompt Files

| File | Covers |
|------|--------|
| `index-prompt.md` | This overview — purpose, constraints, how to use the prompts |
| `prompt-architecture.md` | Layout, state management, CSS, HTML structure |
| `prompt-github-api.md` | All GitHub API interactions — repos, orgs, gists, stats, tree, file content |
| `prompt-file-viewer.md` | Content rendering — markdown, code, images, media, HTML iframes |
| `prompt-navigation.md` | Hash routing, deep linking, sidebar tree, keyboard navigation, filtering |
| `prompt-discover.md` | Discover page — random user, curated lists, top followed search |

## How to Use These Prompts

**For a full rebuild**: Concatenate all prompt files and feed to the LLM:
> "Using the following specs, create a single `index.html` file: [paste all prompt files]"

**For a targeted fix**: Feed only the relevant prompt file(s) plus the current `index.html`:
> "Here is my current app [paste index.html]. Using this spec [paste prompt-file-viewer.md], fix the markdown rendering."

**For adding a feature**: Write a new prompt file, feed it with `prompt-architecture.md` for context:
> "Here is my app's architecture [paste prompt-architecture.md]. Add this feature: [paste new prompt]."

## Hard Constraints (apply to ALL prompt files)

- **Single file**: Everything in one `index.html` — HTML, CSS, JS inline
- **Vanilla JS only**: No frameworks, no jQuery, no build tools, no Node.js
- **ES2020+ features**: `const`/`let` (no `var`), arrow functions, template literals, async/await, optional chaining
- **Functional style**: No classes, no `this` keyword
- **Static hosting**: Must work on GitHub Pages and by opening the file locally
- **External deps allowed**: `marked.js` (CDN) for markdown, `highlight.js` (CDN) for syntax highlighting
- **Security**: All user-supplied strings escaped via `escapeHTML()` / `escapeAttribute()` before insertion into DOM
- **Beginner-readable**: If a student can't follow it, simplify

## Multi-Repo Sync

Three copies of TooToo exist and must stay in sync:
- `theo-armour/sandbox` → `index.html` (root) + `tootoo/index.html`
- `theo-armour/work` → `index.html`

They differ only in initial CONFIG values. Apply fixes to all three.

## Current App Stats (for reference)

- ~1500 lines of HTML/CSS/JS
- 10+ major features (repos, orgs, gists, stats, tree, file viewer, discover, filtering, sorting, keyboard nav)
- Uses GitHub REST API v3 (unauthenticated or with personal access token)

---

# TooToo — Architecture & Layout

## Application State

A single `state` object tracks everything:

```js
const state = {
  owner: '',        // current GitHub user/org
  repo: '',         // current repo name (or gist ID)
  branch: 'main',   // current branch
  tree: [],         // array of tree items from API
  isGist: false,    // gist mode vs repo mode
  currentFilePath: '',  // path of file shown in content area
  repoItems: [],    // cached repo list for sorting
  repoRenderer: null // cached item renderer for re-sorting
};
```

- GitHub token stored in `localStorage` under key `githubToken`
- Recent users stored in `localStorage` under key `tootooRecentUsers` (array, max 10)
- A single `AbortController` (`mainAbortController`) cancels in-flight fetches when a new action starts

## HTML Structure

```
<body>
  <header>
    Title ("TooToo", clickable to reload)
    Owner input (text, with datalist for recent users)
    GitHub profile link button (SVG icon)
    Action buttons: Get Repos, Get Orgs, Get Gists, Stats, Discover
    Expand/Collapse All toggle (hidden until in tree view)
    Token button (right-aligned)
  </header>

  <main>  (flex row, fills viewport below header)
    <div class="sidebar">
      <div id="repoListContainer">  (shown in list mode)
        Heading, filter input, sort dropdown, <ul id="repoList">
      </div>
      <div id="navTree">  (shown in tree mode)
        Heading (with branch selector), tree truncation warning, <div id="treeList">
      </div>
    </div>

    <div class="resizer" id="dragMe">  (draggable column separator)
    </div>

    <div class="content-area" id="mainContent">
      (dynamic content)
    </div>
  </main>
</body>
```

## CSS Architecture

- CSS custom properties for theming: `--primary-bg`, `--secondary-bg`, `--text-color`, `--border-color`, `--highlight-color`, `--hover-bg`, `--font-family`
- `body` is a flex column filling `100vh`
- `main` is a flex row filling remaining space
- Sidebar has a CSS variable `--sidebar-width` (default 250px), updated by the drag resizer
- Content area has `min-width: 0` to allow flex shrinking
- Both sidebar and content area scroll independently (`overflow-y: auto`)

## Resizable Sidebar

- A `.resizer` div (8px wide) sits between sidebar and content
- Pointer events (pointerdown/pointermove/pointerup) handle drag resizing
- Uses `setPointerCapture` for reliable cross-element dragging
- Applies `user-select: none` and `cursor: col-resize` during drag
- Visual feedback: resizer highlights blue on hover and during resize

## Event Delegation

- `repoList` uses event delegation with `data-action` attributes:
  - `select-repo`, `select-owner`, `select-gist`
  - `load-more-repos`, `load-more-orgs`, `load-more-gists`
- `treeList` uses event delegation for `select-file` actions
- Global `keydown` listener handles tree keyboard navigation

## Error Handling

- All fetch operations wrapped in try/catch
- AbortError silently ignored (expected when canceling)
- 403 errors append rate-limit hint
- Global `window.error` and `unhandledrejection` handlers show a styled error panel with reload button
- HTML escaping via `escapeHTML()` and `escapeAttribute()` prevents XSS

## Button State Management

- `btnMainAction` toggles between "Get Repos" and "← Back to Repos" depending on context
- `resetMainAction()` restores all header buttons to their default state
- Orgs/Gists buttons hidden when inside a repo/gist view

## Fetch Pattern

- `fetchList()` is a generic paginated list fetcher accepting a config object:
  - `url`, `label`, `page`, `itemRenderer`, `storeItems`, callbacks
  - Handles pagination (100 per page), "Load More" buttons, abort signals
  - Renders items via the provided `itemRenderer` function

---

# TooToo — GitHub API Interactions

## Authentication

- Optional GitHub Personal Access Token for higher rate limits and private repo access
- Stored in `localStorage` under `githubToken`
- Sent as `Authorization: token <value>` header on all API requests
- Token UI: "⚙️ Token" button opens a `prompt()` dialog; blank clears the token; page reloads after change

## Fetching Repositories

- Endpoint: `GET /users/{owner}/repos?per_page=100&sort=updated&page={n}`
- Paginated: if 100 items returned, show "Load More Repos" button for next page
- Each repo item displays: name, star count, language (with colored dot), GitHub Pages indicator (🌐), and relative time since last push
- Repos cached in `state.repoItems` for client-side re-sorting
- Sort options: Recently Updated (default), Stars, Name, Last Push, Size

### Language Colors

Map of ~30 popular languages to their GitHub-style dot colors (e.g., JavaScript → `#f1e05a`, Python → `#3572A5`).

## Fetching Organizations

- Endpoint: `GET /users/{owner}/orgs?per_page=100&page={n}`
- Clicking an org sets the owner input and fetches that org's repos

## Fetching Gists

- Endpoint: `GET /users/{owner}/gists?per_page=100&page={n}`
- Gist items show description (or first filename as fallback)
- Selecting a gist fetches full gist data: `GET /gists/{id}`
- Gist files are mapped to `state.tree` with `type: 'blob'` and `raw_url` for direct content fetch

## Fetching Stats

Stats adapt based on context:

### User-Level Stats
- Endpoint: `GET /users/{owner}`
- Shows: avatar, name, bio, location, followers, following, public repos, public gists, join date
- Displayed as a card with grid layout

### Repo-Level Stats
- Endpoint: `GET /repos/{owner}/{repo}`
- Shows: avatar, full name, description, stars, watchers, forks, open issues, language, license, created/updated dates, size, homepage, pages status
- Also fetches `GET /repos/{owner}/{repo}/languages` for a language breakdown with percentage bars

## Fetching Repository Tree

- On repo select: first fetch `GET /repos/{owner}/{repo}` to get default branch
- Then fetch branches: `GET /repos/{owner}/{repo}/branches?per_page=100` for branch selector dropdown
- Then fetch tree: `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`
- If `treeData.truncated` is true, show a yellow warning banner
- Tree items stored in `state.tree` array

## Fetching File Content

- Repo files: `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`
- Gist files: use the `raw_url` from the gist API response
- Large files (>1MB): show a confirm dialog before loading
- Approved large files tracked in an in-memory `Set` to avoid repeat prompts

## Rate Limiting

- Unauthenticated: 60 requests/hour
- Authenticated: 5,000 requests/hour
- 403 errors include a hint to add a token
- All fetches share a single `AbortController` — starting a new action cancels any in-flight request

## Recent Users

- Owner input has a `<datalist>` with up to 10 recent usernames
- Updated on successful fetch; stored in `localStorage` as JSON array
- Input clears on focus, triggers fetch on `change` event

---

# TooToo — File Content Viewer

## Content Area Structure

When a file is selected, the content area shows:

```
<div class="file-header">  (sticky, stays at top while scrolling)
  <h3 class="file-title">
    repo-link / path / filename
    GitHub icon link (opens source on GitHub)
  </h3>
  <div class="file-actions">
    "New Tab" button (opens file in new tab)
    Rendered/Raw toggle (for markdown and HTML files)
  </div>
</div>
<div id="viewRendered">  (rendered content)
<div id="viewRaw">  (raw source, hidden by default)
```

## File Type Handling

### Markdown (.md)
- Rendered using `marked.js` (CDN) into a `.markdown-body` div
- Styled with white background, border, rounded corners
- Raw view available via toggle (shows source in `<pre><code>`)
- Internal links rewritten:
  - GitHub blob links → navigate within the app
  - Relative paths → resolved against current directory
  - External links → `target="_blank" rel="noopener"`
- If `marked.parse()` throws, show error banner + raw fallback

### Code / Text Files
- Displayed in `<pre><code class="language-{ext}">` block
- Syntax highlighted via `highlight.js` (CDN, GitHub theme)
- `hljs.highlightAll()` called after content insertion

### Images (.png, .jpg, .jpeg, .gif, .webp, .svg, .ico)
- Displayed inline with `max-width: 100%`
- SVG files also offer raw view toggle (shows SVG source)

### Audio (.mp3, .wav, .ogg)
- HTML5 `<audio>` player with controls, full width

### Video (.mp4, .webm)
- HTML5 `<video>` player with controls, max-width styling

### PDF (.pdf)
- Embedded via Google Docs Viewer: `https://docs.google.com/viewer?url={encoded-url}&embedded=true`
- Displayed in an iframe (80vh height)

### HTML (.html, .htm)
- Raw source fetched, converted to Blob URL
- Embedded in `<iframe sandbox="allow-scripts">`
- Raw/Rendered toggle available
- "New Tab" opens the GitHub Pages URL: `https://{owner}.github.io/{repo}/{path}`

### Binary / Unknown
- Same as text: shown in `<pre>` block (may not be useful for true binaries)

## Large File Protection

- Threshold: `LARGE_FILE_WARNING_BYTES = 1024 * 1024` (1 MB)
- Files exceeding threshold trigger a `window.confirm()` dialog
- Approved files tracked in `approvedLargeFiles` Set (per session)
- File size read from tree API response (`item.size`)

## File Header Details

- Repo name is a clickable link that navigates back to the repo tree root
- Path segments shown with `/` separators
- GitHub icon links to the file on GitHub (or gist URL for gist files)
- "New Tab" button:
  - Repos: opens GitHub Pages URL
  - Gists: opens raw content URL

## Rendered ↔ Raw Toggle

- Two-button toggle: "Rendered" and "Raw"
- Active button has full opacity, inactive has 0.5 opacity
- Toggles `display: block/none` on `#viewRendered` and `#viewRaw` divs
- Only shown for file types that have both views (markdown, HTML, SVG)

---

# TooToo — Navigation, Tree & Filtering

## Hash-Based Routing

URL hash format: `#{owner}/{repo}/{filepath}`

Examples:
- `#theo-armour` → fetch repos for theo-armour
- `#theo-armour/sandbox` → open sandbox repo, show tree + README
- `#theo-armour/sandbox/tootoo/index.html` → open specific file
- `#gist/{gistId}` → open gist
- `#gist/{gistId}/{filename}` → open specific gist file

### Hash Behavior
- `updateHash()` uses `history.pushState` for forward navigation (creates history entries)
- `history.replaceState` used only for the title reload (no history entry)
- Hash not set for auto-displayed READMEs on repo load
- `popstate` and `hashchange` events trigger `handleHashChange()` for back/forward navigation
- Deep linking: on page load, if hash present, navigate to that owner → repo → file

## Sidebar: Repository List Mode

Visible when browsing repos/orgs/gists (before selecting one):

- **Filter input**: debounced (250ms) text filter over repo names; hides non-matching `<li>` elements
- **Sort dropdown**: sorts `state.repoItems` array and re-renders; options: Recently Updated, Stars, Name, Last Push, Size
- **Pagination**: "Load More" button appended when API returns 100 items

## Sidebar: File Tree Mode

Visible after selecting a repo or gist:

### Tree Rendering
- `renderTree()` builds a nested object from flat tree paths, then generates HTML
- Folders rendered as `<details><summary>` elements (native collapsible)
- Files rendered as `<div class="tree-item">` with `data-action="select-file"` and `data-path`
- Folders sorted before files, then alphabetically
- File sizes shown right-aligned in a `.tree-item-size` span
- Monospace font for tree items

### Branch Selector
- Dropdown `<select>` in the Files heading
- Switching branches re-fetches the tree via `handleSelectRepo(repo, true, newBranch)`

### Expand All / Collapse All
- Toggle button in header (hidden until tree view active)
- Sets/removes `open` attribute on all `<details>` elements
- Button text switches between "Expand All" and "Collapse All"

### Auto-Open README
- When a repo is selected, the tree loads and then auto-opens `README.md` (case-insensitive, also matches `readme.txt`)
- Uses `state.tree.find()` on the flat tree array

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

## Navigation Between Views

| From | To | Trigger |
|------|-----|---------|
| Repo list | Repo tree | Click repo item |
| Repo tree | File content | Click file in tree |
| Repo tree | Repo list | "← Back to Repos" button |
| Org list | Repo list | Click org name |
| Gist list | Gist files | Click gist |
| Any view | Repo list | Change owner input + Enter |
| Any view | Discover | Click "🌍 Discover" button |
| Discover | Repo list | Click back or select a user |

---

# TooToo — Discover Feature

## Purpose

The Discover page helps users find interesting GitHub accounts when they don't know who to search for. Accessed via the "🌍 Discover" button in the header (styled dark background for visual emphasis).

## UI Layout

A centered card (max-width 800px) with three sections:

### 1. Roll the Dice — Random User
- Large "Surprise Me (Random User)" button (dark background)
- `handleRandomUser()`: generates a random ID (1 to 100M), fetches `GET /user/{id}`
- Tries up to 8 attempts (many IDs are deleted/suspended and return 404)
- On success: sets owner input and fetches repos
- On failure after all attempts: shows error message

### 2. Curated Suggestions
Three categorized groups of notable GitHub accounts:

| Category | Users |
|----------|-------|
| Creative Coding & 3D | mrdoob, pmndrs, greggman, d3, playcanvas |
| Massive Orgs | microsoft, google, nasa, vercel, freeCodeCamp |
| Prolific Devs | sindresorhus, tj, torvalds, ruanyf, gaearon |

- Each user is a button; clicking sets the owner and fetches repos
- Styled as pill buttons with hover highlight

### 3. API Search — Top Followed Users
- "Fetch Top Followed Global Users" button
- `handleSearchTopUsers()`: calls `GET /search/users?q=followers:>20000&sort=followers&order=desc&per_page=30`
- Results displayed as a responsive grid of cards, each showing:
  - Avatar (64px, rounded)
  - Username (bold, blue)
- Clicking a card sets the owner and fetches repos

## Navigation
- When Discover is active:
  - Sidebar (repo list and tree) is hidden
  - Orgs/Gists buttons are hidden
  - Main action button becomes "← Back to Search"
- Back button restores previous state or returns to repo list
