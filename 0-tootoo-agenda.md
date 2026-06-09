# TooToo — Agenda

This is the current TooToo roadmap.

## Apps

* "file:///g%3A/My%20Drive/2026-theo-github/theo-armour-sandbox/0-apps/newww-tab/newww-tab.html"
* G:\My Drive\2026-theo-github\pushme-pullyou-github'
* G:\My Drive\2026-theo-github\pushme-pullyou-assets'
* G:\My Drive\2026-theo-github\theo-armour-2025'
* G:\My Drive\2026-theo-github\theo-armour-2026'
* G:\My Drive\2026-theo-github\theo-armour-agenda'
* G:\My Drive\2026-theo-github\theo-armour-pages'
* G:\My Drive\2026-theo-github\theo-armour-qdata'
* G:\My Drive\2026-theo-github\theo-armour-sandbox'
* G:\My Drive\2026-theo-github\theo-armour-aa'
* G:\My Drive\2026-theo-github\theo-armour-genealogy'
* G:\My Drive\2026-theo-github\theo-armour-wikitheo
* I:/My%20Drive/tech/index.html



## Copy Index to Repo

* 2026-05-26 ~ update both local and GitHub repos: or maybe separate apps

## Theming

## Content Header bar

* 2026-05-31 ~ repos to the header bar
* 2026-05-31 ~ add branches to the header bar

### Sidebar


### About

* 2026-05-26 ~ Update readme
* About shows the live branch count (name + all-branches link done 2026-06-08)

### Content

* 2026-04-30 Display notebooks?

## Code

* Can run if dependency fails to load, just show error message and disable features that rely on it


## More
A few ideas that fit the vanilla JS / single-file constraints:

**High value, low effort:**
- **File search** (`Ctrl+F` in sidebar) — fuzzy match across all file paths, not just the filter substring match. Jump to result on Enter.
- **Recent files list** — track last 10 opened files in localStorage, show as a dropdown or section. Quick switching without scrolling the tree.
- **Keyboard shortcut for toggling sidebar** — `Ctrl+B` (VS Code convention). Useful on narrow screens.

**Medium effort, very useful:**
- **In-file text search** — `Ctrl+G` to search within the currently displayed file content. Highlight matches, navigate with Enter/Shift+Enter.
- **Multi-file diff view** — compare two files side by side. Pick from tree, split the content area. Great for seeing changes across versions.
- **Branch/tag switcher** — dropdown in the header to switch branches. Already have `state.branch`, just need a `GET /repos/.../branches` call and re-fetch the tree.

**Fun/polish:**
- **Minimap** — a thin vertical strip next to code files showing a zoomed-out view, like VS Code. Just a scaled `<canvas>` rendering of the text.
- **File preview on hover** — tooltip showing first few lines when hovering a tree item. Debounced fetch with cache.
- **Repo comparison** — enter two `owner/repo` pairs, see a split view of their trees side by side. Good for comparing forks.
- **Permalink button** — generates a full URL with owner/repo/branch/file in query params + hash. One-click copy for sharing.
- **Print/export** — render current markdown file to a clean print stylesheet, or offer "Save as PDF" via `window.print()` with `@media print` styles.

The branch switcher and recent files feel like the biggest bang for the buck — they address real friction without adding complexity.




## Prompt

* 2026-04-07 ~ Split prompt into three or more sections. So it can be used to generate multiple types of TooToos

