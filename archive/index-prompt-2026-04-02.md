# Index Prompt

**Create a file browser for the `theo-armour/sandbox` GitHub repo as `index.html`, a single HTML file hosted in the `tootoo/` subfolder on GitHub Pages.**

## Layout

- Light header (#f6f8fa background, #24292f text, bottom border) with title "📂 {owner}" (set dynamically from CONFIG) and a "View on GitHub" link to `https://github.com/{owner}/{repo}` (also dynamic)
- A `<select id="ownerSelect">` dropdown for switching between the configured owner and their organizations; fetches orgs via `GET /users/{owner}/orgs` (with token) on init and on Connect/Disconnect; uses org-aware API endpoints (`/orgs/` vs `/users/`) based on selection
- A `<select id="repoSelect">` dropdown between the title and the GitHub link lists all repos belonging to the selected owner/org; defaults to CONFIG.repo
- Page `<title>` is set to `TooToo - {owner}/{repo}` on init and on repo switch
- Clicking the title reloads the app to its initial state (navigates to the page URL without any hash); title uses `#appTitle` with an event listener (no inline `onclick`)
- Header contains token UI: a password input and green "Connect" button (visible when no token is stored), or a green "Connected" label and red "Disconnect" button (visible when a token is stored)
- Two-panel layout filling the viewport:
  - **Left panel**: resizable tree view (280px default, 120–400px range) with folder/file navigation; a custom drag handle (6px bar on right edge, blue on hover/drag) supports both mouse and touch resizing
  - **Right panel**: content viewer with a sticky header showing the file path as clickable breadcrumbs and action buttons (📋 Copy, Raw, GitHub)
- **Viewport & mobile**: `<meta name="viewport" content="width=900">` with `.container { min-width: 900px }` ensures the two-panel layout never shrinks; on narrow/portrait screens the page scrolls horizontally while each panel scrolls vertically independently

## Tree View

- Fetch the full repo tree dynamically from the GitHub API on load using the Git Trees endpoint with `?recursive=1`
- API URL: `https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1`
- If a GitHub token is provided, send it as an `Authorization: token <value>` header (required for private repos)
- Show a loading spinner in the tree panel while fetching
- On API error, display an error message in the tree panel with a "Retry" button (`#btnRetry` with event listener, no inline `onclick`); 404 errors hint that the repo may be private
- All folders are closed when the app first loads
- Folders sort before files, then alphabetically
- Folders toggle open/close on click; **accordion behavior**: opening a folder auto-collapses its sibling folders at the same level (keeps exactly one path expanded per depth)
- When a folder is opened, its `README.md` is automatically displayed in the content panel (if it exists), with the tree item visually selected, without updating the URL hash
- File icons by extension using emoji: 📁/📂 folders, 📝 .md, 📕 .pdf, 📊 .xlsx, 📋 .json, 🌐 .html, ⚙️ .yml, 🖼️ images, 📄 default
- Skip hidden files (dotfiles) and `node_modules`
- Selected file gets a blue highlight (#ddf4ff); keyboard-navigated items get a separate grey highlight (#eaeef2 `.highlighted` class) so the active file remains visually distinct
- The app tracks `selectedEl` (active file) and `highlightedEl` (keyboard cursor) as module-level variables for efficient lookups
- Nested indentation increases by 16px per level, applied as inline `style="padding-left"` during `renderTree` (supports unlimited depth)
- Each tree item stores its full path in a `data-path` attribute for reliable lookup; queries use `CSS.escape()` on paths to handle special characters
- Folders display a file-count badge (recursive count of non-hidden files); files display their size (from the API `size` field) formatted as B/KB/MB
- Badges are right-aligned, grey (#656d76), 11px, in a `.badge` span with `margin-left: auto`
- Tree items are built with `createElement` + `textContent` (not `innerHTML`) to prevent XSS from file names
- Tree items have `role="treeitem"`, folders have `aria-expanded`; the tree container has `role="tree"`; children wrappers have `role="group"`

### Tree Header & Controls

- Sticky tree header (with `z-index: 2`) contains "Files" label, a ⊕ "Focus on active path" button, and a ⊞/⊟ toggle button (expand all / collapse all)
- ⊕ Focus button collapses everything then expands only the path to the currently selected file, scrolling it into view
- ⊞/⊟ Toggle button expands all folders or collapses all folders; label switches based on current state
- Below the header, a sticky `type="search"` filter input ("Filter files...") with a native browser clear (✕) button and `aria-label="Filter files"`
- Filter matches **file names only** (folders and path segments are ignored); matching files are shown with their parent folders auto-expanded (via `filter-expanded` class)
- Filter input is debounced (150ms) to avoid excessive DOM traversal on fast typing
- Clearing the filter restores the original tree state

### Keyboard Navigation

- Arrow Down / Arrow Up moves through visible tree items: **files are activated** (loaded in content panel), **folders are highlight-only** (grey background, not expanded); the highlight is cleared when a file is activated
- Visible items list is cached and invalidated on tree structure changes (fold/unfold, filter, toggle-all) for performance
- Enter or Space activates the highlighted item (opens/closes a folder, or loads a file)
- Arrow Right expands a highlighted folder (if collapsed); triggers accordion collapse of siblings
- Arrow Left collapses a highlighted folder (if expanded)
- Selected item scrolls into view; tree items have `scroll-margin-top: 76px` to clear the sticky header and filter bar
- Keyboard navigation is disabled when focus is in the filter input or other text fields

## Content Viewer

- On initial load (no hash), the root `README.md` is automatically displayed without setting the hash
- **Markdown** (.md): rendered with a lightweight inline converter (headings, bold, italic, strikethrough, inline code, fenced code blocks, links, images, ordered/unordered lists, horizontal rules, paragraphs); styled with `github-markdown-css`
- **Images** (.png, .jpg, .jpeg, .gif, .svg, .webp, .ico, .bmp, .avif): display inline with `max-width: 100%`
- **Video** (.mp4, .webm): HTML5 `<video>` player with controls; shows duration and file size on load
- **Audio** (.mp3, .wav, .ogg, .aac, .flac): HTML5 `<audio>` player with controls; shows duration and file size on load
- **HTML** (.html, .htm): embedded in a sandboxed `<iframe>` (`allow-scripts allow-same-origin`) with an "Open in new tab" link
- **PDF**: show an embedded iframe (responsive height, matching HTML iframes) with a download link
- **Excel** (.xlsx, .xls): show a download link
- **Other text files**: show in a monospace `<pre>` block; URLs are auto-linked (clickable) using a `linkifyAndEscape` helper that escapes HTML but wraps `http://` and `https://` URLs in `<a>` tags with `target="_blank"`
- **Large file prompt**: text-based files over 512 KB (`LARGE_FILE_THRESHOLD`) show a centered warning with the file name, size, and a "Load anyway" button instead of auto-loading; media files (images, video, audio, PDF, Excel) are exempt since they stream natively
- "Raw" button toggles markdown between rendered and raw views
- "GitHub" button opens the file on GitHub in a new tab
- "📋 Copy" button copies the current file path to the clipboard (wrapped in try/catch for non-secure contexts); shows "✓ Copied" or "✗ Failed" feedback for 1.5 seconds
- File path displayed as clickable breadcrumbs: folder segments are links that expand the folder in the tree; the filename is plain text
- Breadcrumbs use `data-folder` attributes with event delegation on the content path element (no inline onclick handlers)
- Loading spinner animation while fetching
- All file content is fetched via relative paths (`"../" + item.path`) when browsing the local repo (`CONFIG.localRepo`), since the app lives in a `tootoo/` subfolder and `../` resolves to the repo root (works both locally and on GitHub Pages)
- For other repos, file content is fetched from `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`

## Navigation

- Update `location.hash` only when a user explicitly clicks a file in the tree; skip setting the hash if it already matches (avoids duplicate history entries from deep-link navigation)
- Auto-displayed READMEs (root and folder) do not set the hash
- On load, if a hash is present, auto-navigate to that file (expand parent folders with accordion awareness — using `CSS.escape` for safe selectors and `aria-expanded` attribute updates)
- Listen for `hashchange` events

## GitHub API & Token Authentication

- Configuration object at the top of the script:

  ```js
  const CONFIG = {
    owner: "theo-armour",
    repo: "sandbox",
    branch: "main",
    localRepo: "sandbox"  // the repo this app is hosted in (uses relative paths)
  };
  ```

- Header contains a password input (`#tokenInput` with `aria-label`), Connect button (`#btnConnect`), Disconnect button (`#btnDisconnect`), and status label (`#tokenStatus`)
- When no token is stored: input and Connect button are visible; Disconnect is hidden
- When a token is stored: input and Connect are hidden; "Connected" label and Disconnect button are visible
- Token is stored in `localStorage` under key `gh-token` (persists across sessions)
- On Connect: save the token to `localStorage`, hide the input, clear the cached tree from `sessionStorage`, re-fetch repos list, and re-fetch the tree
- On Disconnect: remove the token from `localStorage`, show the input, clear the cached tree, re-fetch repos list, and re-fetch the tree
- On init, fetch the recursive tree: `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/git/trees/${CONFIG.branch}?recursive=1`
- If a token exists, include `Authorization: token <value>` header in API requests
- The API returns `{ tree: [{ path, type, ... }] }` where `type` is `"blob"` (file) or `"tree"` (folder)
- Parse the flat array into a nested tree structure for rendering
- Cache the fetched tree in `sessionStorage` keyed by `tree-{owner}-{repo}-{branch}` to avoid redundant API calls on page reload

## Repo Selector

- On init, fetch repos via `GET /users/{owner}/repos?per_page=100&sort=updated` (includes token if present)
- Populate `#repoSelect` dropdown with repo names; private repos prefixed with 🔒
- Default selection is `CONFIG.repo` ("sandbox")
- On change: update `CONFIG.repo` and `CONFIG.branch` (reset to "main"), clear the hash, reset UI state (currentFile, selectedEl, highlightedEl, content panel), update title/link, clear sessionStorage cache, and re-run `initTree()`
- Re-fetched on Connect/Disconnect (private repos may appear or disappear)
- Fails silently — dropdown shows just the current repo if API call fails

## Tech Stack

- Single HTML file with embedded CSS and JS
- Vanilla JavaScript (ES2020+, no frameworks)
- No external JavaScript dependencies (no Showdown or other CDN scripts)
- External stylesheet: `github-markdown-css` 5.5.1 (from CDN, for markdown styling)
- Inline lightweight markdown-to-HTML converter (`mdToHtml` and `inline` functions); `javascript:` URLs in markdown links are stripped for XSS safety; bare URLs (`http://` and `https://`) in markdown text are auto-linked (skipping URLs already inside `<a>` tags or other HTML elements)
- Shared `escapeHtml` helper (single function used everywhere: markdown code blocks, raw text display, error messages, file names)
- `linkifyAndEscape` helper for plain text views: escapes HTML but auto-links bare URLs as clickable `<a>` tags
- All user-facing error messages are HTML-escaped before insertion
- File names rendered via `textContent` (not `innerHTML`) in the tree to prevent injection
- File URLs use `encodeURI()` in content viewer templates
- CSS selectors use `CSS.escape()` on user-derived paths
- All inline styles moved to the `<style>` block (header elements, token UI, retry button) via named CSS classes
- All JavaScript uses arrow function expressions (`const fn = () => {}`); no `function` declarations
- GitHub Pages compatible (static, no build step)
- Tree data fetched from GitHub REST API (supports both public and private repos via optional token)
- File content fetched via relative paths (`basePath + item.path`) for the local repo, or via `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}` for other repos
- **`isLocal` detection**: the app only uses relative paths when running over HTTP (not `file://`) and the current repo matches `CONFIG.localRepo`; when opened via `file://` protocol, relative `fetch()` calls are blocked by CORS, so it always uses remote GitHub URLs
- **`hasPages` detection**: each repo `<option>` stores `data-has-pages` from the GitHub API's `has_pages` field; `pagesUrl` uses `https://{owner}.github.io/{repo}/{path}` when Pages is enabled, falling back to the raw.githubusercontent URL when it's not
- **URL selection by file type**: text content is always fetched via `rawUrl` (raw.githubusercontent.com has `Access-Control-Allow-Origin: *`); HTML iframes use `pagesUrl` (proper MIME types); images, video, and audio use `rawUrl` (works everywhere via element `src`)

## Style

- GitHub-inspired design using the GitHub color palette (#24292f, #f6f8fa, #d0d7de, #0969da, #58a6ff, etc.)
- System font stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial
- Monospace for code/paths: SFMono-Regular, Consolas, Liberation Mono, Menlo
- Smooth transitions on hover (0.1s background)
- Error state styled in red (#cf222e on #ffebe9)
- Token input styled to match the light header (#fff background, #24292f text, #d0d7de border)
- Connect button styled green (#238636)
- Disconnect button styled red (#da3633)
- "Connected" status label in green (#3fb950)

## Repository Stats Modal

- Triggered by 📊 button in the header; opens a scrollable modal overlay
- Shows file count and total size by extension (sorted by count descending)
- Shows the 10 largest files with paths and sizes
- Built from the cached tree data (no additional API calls)

## Owner Profile Modal

- Triggered by 👤 button in the header; opens a scrollable modal overlay
- Fetches owner data from `GET /users/{owner}` (detects user vs. organization from `data.type`)
- Fetches repos and organizations in parallel (`Promise.all`)
- **Header**: avatar, display name, @login, bio, location, company, blog link, Twitter/X handle, join date
- **Contributions graph** (users only, requires token): fetched via GitHub GraphQL API; renders a grid of colored day cells with a legend (Less → More); shown between the header and overview
- **Achievements** (users only, requires token): fetched from the same GraphQL query (`contributionsCollection`); shows total commits, pull requests, issues opened, code reviews, repositories created, and private contributions (if nonzero) in a table
- **Overview table**: public repos, public gists, followers, following, total stars earned, total forks, active repos in last 30 days
- **Organizations**: fetched from `GET /users/{owner}/orgs`; displayed as a row of linked avatar images (32×32, rounded); each links to the org's GitHub page
- **Top languages**: table of up to 8 languages by repo count
- **Recently updated**: table of last 5 repos with relative timestamps; repo names link to their GitHub pages; private repos prefixed with 🔒
- **Clickable section titles**: all `<h3>` headings are `<a>` links to relevant GitHub pages:
  - Contributions → `https://github.com/{owner}`
  - Achievements → `https://github.com/{owner}?tab=achievements`
  - Overview → `https://github.com/{owner}`
  - Organizations → `https://github.com/{owner}`
  - Top languages → `https://github.com/{owner}?tab=repositories`
  - Recently updated → `https://github.com/{owner}?tab=repositories&sort=updated`
- Followers and Following counts link to `?tab=followers` and `?tab=following` respectively
- Styled with `.modal h3 a` inheriting color, showing blue + underline on hover
- Error fallback messages for failed contributions/achievements loads
