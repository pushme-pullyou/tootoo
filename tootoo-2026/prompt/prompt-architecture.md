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
