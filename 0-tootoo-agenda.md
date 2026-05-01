# TooToo — Agenda

## Agenda

### App

* favicon to GitHub organization
* User theming
* Make sure all the different code sections are relevant and are factual.
* That the numbering of sections is relevant

### Sidebar

* Much better filters
* Add keystroke to initiate sidebar scrolling
* If there are multiple branches add a branch selector to the sidebar
* Add a footer to the sidebar with copyright and license info, and a link go to top
* Control B to Toggle sidebar

### About
* 2026-04-30 About: add copyright and license info, and a link to the GitHub repo
* 2026-04-30 About ~ rejig: repo, tips, about TT ~ click again to return
* About shows number of branches, not just the default branch
* Token: click to return

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

