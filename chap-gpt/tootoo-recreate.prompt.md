# Prompt: Recreate TooToo LT — Multi-Pass External Prompt

Copy everything below the `---` into Grok, ChatGPT, or Gemini and ask it to produce a single `index.html`. The model should work through the phases internally, but only emit the final file in its final answer.

---

Build a **single-file HTML application** called **TooToo LT** — a lightweight GitHub repository browser that runs entirely in the browser with no backend. Deliver one file named `index.html` with all HTML, CSS, and JavaScript inline. No frameworks, no build tools, no Node.js. It must work when opened via `file://` and when hosted on GitHub Pages.

## How To Work

Perform this task in **multiple internal passes**. Do not ask the user for approval between passes unless you are blocked by a genuine ambiguity. Do not output partial drafts. Think through the phases below internally, then emit one final complete `index.html` only.

### Internal Phases

1. Analyze the requirements and create an internal checklist of required behaviors.
2. Design the page structure, state model, storage model, and helper functions.
3. Implement the shell: layout, header, sidebar, content area, theme, sizing.
4. Implement repo detection, GitHub API access, tree loading, filtering, and routing.
5. Implement content rendering, safety behavior, and media handling.
6. Run a self-audit against the checklist before producing the final output.

If any detail conflicts, prefer the more specific requirement later in this prompt over an earlier general statement.

## Hard Constraints

- Vanilla HTML5, CSS3, and JavaScript (ES2020+). No React, Vue, jQuery, bundlers, or build steps.
- Functional style: prefer `const` and arrow functions; no classes, no `this`, no `var`.
- All HTML, CSS, and JavaScript must be inline in one `index.html` file.
- Standard `<head>` must include `<meta charset="UTF-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1.0">`, and `<title>TooToo LT</title>`.
- Use CSS custom properties in `:root` for repeated colors, sizing, and spacing.
- Use a single `const CONFIG = {}` for owner/repo/branch defaults and a single `const state = {}` for runtime state.
- Escape all content-derived strings with an `escapeHTML` helper.
- Sanitize rendered Markdown with `DOMPurify.sanitize()`.
- Keep the code beginner-readable. Use comments only when intent would otherwise be hard to follow.
- Final output must be a single complete `index.html` file and nothing else.

## External Libraries

Use these CDN assets in `<head>`:

- `marked`: `https://cdn.jsdelivr.net/npm/marked/marked.min.js`
- `highlight.js` core v11.9.0: `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js`
- `highlight.js` theme via `<link id="hljsTheme">` using `github.min.css` and `github-dark.min.css`
- `DOMPurify` v3: `https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js`
- `SheetJS`: `https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js`

## App Definition

TooToo LT is the primary TooToo. It is a single-file GitHub repository browser that:

- detects a repository from URL params, GitHub Pages hosting, `.git/config`, or cached settings
- loads the repository tree for the current branch
- renders files in a sidebar/content split view
- supports Markdown, code, images, audio, video, PDFs, spreadsheets, SVG, and HTML preview
- persists useful user preferences in `localStorage`

## Layout

Use this structure:

```text
┌─ header ───────────────────────────────────────────────────┐
│ [GH icon] Title              [🌙] [A−] [A+] [?] [⚙️ Token]  │
├─ sidebar ─┬─ resizer ─┬─ content-area ─────────────────────┤
│ filter    │           │ breadcrumb + action buttons         │
│ tree      │   (drag)  │ rendered content                    │
└───────────┴───────────┴─────────────────────────────────────┘
```

Requirements:

- `body`: `display: flex; flex-direction: column; height: 100vh`
- `main`: `display: flex; flex-direction: row; flex: 1; overflow: hidden`
- Sidebar width is stored in `--sidebar-width`, default `300px`
- Resizer is a draggable vertical bar clamped to `[100, window.innerWidth - 100]`
- `@media (max-width: 768px)`: narrower sidebar and stacked file header
- Include a sticky file header above content
- Include a back-to-top button
- Include a skip link for accessibility

## Header Behavior

- GitHub icon links to `https://github.com/{owner}/{repo}`
- Title shows `{owner} / {repo}`
- Clicking the title clears the current file preference and reloads
- Dark mode toggle persists as `darkMode` and also swaps the highlight.js theme
- `A−` and `A+` adjust `--font-size` in 2px steps clamped to `[10, 28]`
- Include a help/about button
- Include a token button that opens an inline token form with save/clear behavior
- Show a rate-limit badge when GitHub returns rate-limit headers

## Storage Model

Use `localStorage` keys based on:

```js
`tootoo-lt:${location.pathname}:${suffix}`
```

Use that namespacing for app-level preferences such as:

- dark mode
- font size
- sidebar width
- file text cache
- preferred rendered/raw view by extension
- cached repo identity

Use bare `githubToken` for the token.

Important: the last-opened file must be **repo-scoped**, not just app-scoped. Scope it per `owner/repo/branch`, for example by folding that triple into the suffix. Do not restore a remembered file unless it exists in the current tree.

## Repo Detection

Detect the repo in this order:

1. URL query params `?owner=&repo=&branch=`
2. Cached repo identity under a namespaced `repo` key
3. GitHub Pages URL inference: owner is first subdomain, repo is first path segment or `{owner}.github.io`
4. `.git/config` lookup by trying relative prefixes such as `''`, `'../'`, `'../../'`, etc.
5. If detection fails, render an inline owner/repo form

Support both `http(s)` and `file://`. For `file://`, allow a sync XHR fallback for `.git/config` if `fetch()` fails.

## GitHub API

All API requests use:

- `Accept: application/vnd.github+json`
- `Authorization: token {pat}` when a token is present

Required behavior:

- Fetch repo info if branch is unknown and use `default_branch`
- Fetch the recursive tree for the current branch
- Show a rate-limit warning on `403`
- Abort in-flight requests before starting a new file/tree request

## Tree Rendering

- Build a nested tree from flat Git paths
- Skip dotfiles and dotfolders: ignore any path containing a segment that starts with `.`
- Sort folders first, then files, case-insensitive alphabetical
- Render folders as `<details><summary class="tree-folder">…</summary></details>`
- Render files as selectable rows with `data-action="select-file"` and `data-path`
- Bold files whose basename matches `/^readme/i`
- Render root entries in batches to avoid freezing on large trees
- Support expand/collapse all
- Support keyboard navigation in the tree

Use readable emoji icons for major file types.

## Filtering

- Include a debounced filter input and clear button
- Filter against lowercase file paths
- Auto-open folders that contain visible descendants
- Hide folders with no visible descendants

## Routing And Startup Priority

Startup priority:

1. `location.hash` if present
2. repo-scoped last-opened file if it exists in the current tree
3. first `README.md` or `README.txt`, preferring repo root

On successful file open:

- update the URL hash
- use `pushState` the first time and `replaceState` after
- save the repo-scoped current file
- scroll content to top

Bind `popstate` and `hashchange` to re-select the requested file.

## File Header And Actions

The file header should include:

- GitHub icon linking to the current file on GitHub
- breadcrumb trail `repo / folder / folder / file`
- repo breadcrumb resets home
- folder breadcrumbs scroll/open the matching folder in the sidebar
- rendered/raw toggle for Markdown, HTML/HTM, and SVG
- copy button for text-like content
- new-tab button

For new-tab behavior:

- use GitHub Pages URLs when Pages is enabled
- otherwise fall back to `raw.githubusercontent.com`

## Rendering By File Type

### Markdown

- Render with `marked.parse()` then sanitize with `DOMPurify`
- Provide rendered/raw toggle
- Rewrite Markdown links after render

Link rewrite rules:

- keep anchor-only links as anchors
- external `http(s)` links open in a new tab with `rel="noopener"`
- GitHub blob links to the same `owner/repo/branch` navigate in-app
- relative links resolve against the current markdown file directory
- root-relative links resolve from repo root

Image rewrite rules:

- relative `img[src]` paths inside rendered Markdown must resolve against the current markdown file directory
- root-relative `img[src]` resolves from repo root
- external, `data:`, and `blob:` images remain untouched

### HTML And HTM

- render the file in an `<iframe>` using a `Blob` URL
- provide rendered/raw toggle
- use a **strict sandbox by default**: `sandbox` with no `allow-scripts`
- do not use `srcdoc`

### SVG

- render as an image and support rendered/raw toggle

### Images

- render image files directly

### Audio / Video / PDF

- render with native media elements or iframe for PDF

### Spreadsheets

- use `SheetJS` to render workbook sheets to HTML tables

### Code / Text

- render in `<pre><code>`
- use `highlight.js` where practical
- skip syntax highlighting on very large files

## Fetching And Caching

Implement a text cache with:

- in-memory `Map`
- LRU behavior
- max 25 entries
- skip caching very large texts
- persistence to `localStorage` when practical

File text fetch behavior:

1. Try local file access first when local mode has been confirmed
2. Then try cache
3. Then fetch via GitHub API raw contents when token exists
4. Otherwise fetch from `raw.githubusercontent.com`

For binary/media content:

- use raw URLs directly when possible
- when authenticated fetching is needed, fetch as `Blob` and create blob URLs
- track blob URLs in a `Set` and revoke them before new selections and on unload

Implement `encodePath(path)` by encoding each path segment separately.

## Local Mode

Support a local-first mode for `file://` use and local working copies:

- probe whether local file reads work
- if confirmed, prefer local file fetches so uncommitted edits show up immediately

## Error Handling

- ignore `AbortError` when requests are intentionally cancelled
- render other file-load errors in the content area in red
- attach global `error` and `unhandledrejection` handlers that render a bordered reload panel

## Initialization

At the end of the script, call `init()`.

Initialization must:

1. restore appearance settings and cached text cache
2. wire all listeners
3. detect the repo
4. update the header once repo info is known
5. fetch the tree
6. probe local mode
7. open the initial file using the priority rules above
8. focus a visible tree item if no file is selected

## Visual And Accessibility Notes

- Semantic `<header>` and `<main>`
- Buttons with subtle hover/active motion
- Tree rows highlight on hover
- Active file row uses highlight color and white text
- Reduced-motion support
- Screen-reader helper class and skip link

## Self-Audit Checklist

Before producing the final file, internally confirm all of the following:

- one file only, named `index.html`
- no frameworks, no external build steps
- works on GitHub Pages and `file://`
- Markdown links are rewritten correctly
- Markdown relative images are rewritten correctly
- HTML preview is sandboxed without `allow-scripts`
- last-opened file persistence is scoped per `owner/repo/branch`
- stale remembered paths are ignored if not found in the current tree
- hash routing works
- tree filtering and keyboard navigation work
- rendered/raw toggles exist for Markdown, HTML/HTM, and SVG
- dark mode and font size persist
- code is readable and consistent

## Final Output Contract

Return only one complete `index.html` file in the final answer. Do not include explanation before or after the file. Do not emit TODOs, pseudo-code, or multiple alternatives.
