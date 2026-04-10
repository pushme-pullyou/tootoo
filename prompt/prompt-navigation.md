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
