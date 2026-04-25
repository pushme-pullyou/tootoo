# Prompt: Recreate TooToo LT — Core Browser

Copy everything below the `---` into ChatGPT / Grok / **Gemini** (recommended first try) and ask for a single `index.html`.

---

Build a **single-file HTML application** called **TooToo LT** — a lightweight GitHub repository browser that runs entirely in the browser with no backend. Deliver one file named `index.html` with all HTML, CSS, and JavaScript inline. No frameworks, no build tools, no Node.js. Must work when opened via `file://` (double-click) and when hosted on GitHub Pages.

## Hard constraints

- Vanilla HTML5, CSS3, JavaScript (ES2020+). No React/Vue/bundlers.
- Functional style: prefer `const` and arrow functions; no classes, no `this`, no `var`.
- CSS custom properties (`--vars`) in `:root` at the top of `<style>`; dark-mode overrides on `body.dark-mode`.
- Bundle state in a single `const state = {}` object (plus `const CONFIG = {}` for owner/repo/branch).
- Persist preferences to `localStorage` under namespaced keys: `` `tootoo-lt:${location.pathname}:${suffix}` ``. GitHub token uses the bare key `githubToken`.
- Escape all content-derived strings (write an `escapeHTML` helper).
- Use `DOMPurify.sanitize()` on rendered Markdown.
- HTML file previews must render in an `<iframe sandbox="allow-scripts">` from a `Blob` URL — never via `srcdoc`.
- Standard `<head>`: `<meta charset="UTF-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1.0">`, `<title>TooToo LT</title>`.

## External libraries (CDN, in `<head>`)

- `marked` — `https://cdn.jsdelivr.net/npm/marked/marked.min.js`
- `highlight.js` v11.9.0 core — `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js`
- `highlight.js` theme via `<link id="hljsTheme">`; swap `styles/github.min.css` ↔ `styles/github-dark.min.css` on dark-mode toggle.
- `DOMPurify` v3 — `https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js`

## Layout

```
┌─ header ───────────────────────────────────────────────────┐
│ [GH icon] Title              [🌙] [A−] [A+] [⚙️ Token]       │
├─ sidebar ─┬─ resizer ─┬─ content-area ─────────────────────┤
│ filter    │           │ breadcrumb + action buttons         │
│ tree      │   (drag)  │ rendered content                    │
└───────────┴───────────┴─────────────────────────────────────┘
```

- `body`: `display: flex; flex-direction: column; height: 100vh`.
- `main`: `display: flex; flex-direction: row; flex: 1; overflow: hidden`.
- Sidebar width is CSS var `--sidebar-width` (default 300px). Resizer is a draggable vertical bar; clamp [100, window.innerWidth - 100]; persist width on pointerup.
- `@media (max-width: 768px)`: sidebar becomes `width: 25% !important`, file-header stacks vertically.

## Header buttons

- **GitHub icon** — anchor linking to `https://github.com/{owner}/{repo}`.
- **Title** (`{owner} / {repo}`) — click clears `currentFile` and reloads.
- **🌙 / ☀️** dark mode — persist as `darkMode`; also swaps the highlight.js theme.
- **A− / A+** — adjust `--font-size` in 2px steps, clamped [10, 28]; persist as `fontSize`.
- **⚙️ Token** — inline form: input (password, show/hide checkbox), Save, Clear. Save stores `githubToken` in localStorage and reloads.

## Repo detection (in order)

1. URL query params `?owner=&repo=&branch=`.
2. Cached `{owner, repo, branch}` under namespaced `repo` key.
3. If `location.hostname` ends with `.github.io`: owner = first subdomain, repo = first path segment (or `{owner}.github.io`).
4. Otherwise render an inline form asking for owner + repo; cache on submit.

## GitHub API

All requests: `Accept: application/vnd.github+json`, plus `Authorization: token {pat}` when a token is set.

- If branch unknown: `GET /repos/{owner}/{repo}` → read `default_branch`; cache.
- `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1` → flat tree array.
- On `403`, show "Rate limited. Add a GitHub token for higher limits." in the tree list.
- Abort in-flight requests via a shared `AbortController` before starting a new one.

## Tree rendering

- Build a nested tree from the flat paths. **Skip any path whose segments start with `.`** (dotfiles/dotfolders).
- Sort each level: folders first, then files, alphabetical case-insensitive.
- Folder: `<details><summary class="tree-folder">📁 name</summary>…</details>` — hide the default disclosure marker.
- File: `<div class="tree-item" data-action="select-file" data-path="{path}">` with an emoji prefix. Bold any file matching `/^readme/i`.
- Render root entries in batches of 120 with `setTimeout(…, 0)` between batches.
- Icon map: `.md`=📝, `.js/.mjs/.cjs`=🟨, `.ts/.tsx`=🟦, `.py`=🐍, `.html/.htm`=🌐, `.css/.scss/.less`=🎨, images=🖼️, `.pdf`=📕, `.json`=`{ }`, default=📄.

## Sidebar filter

- Text input + ✕ clear button. Debounced 150ms.
- Hide `.tree-item` whose lowercased path doesn't contain the query.
- Walk folders: if any descendant item is visible, show the folder and `open = true`; else hide it.

## File actions header

Sticky, above the content body:

- GitHub icon → `https://github.com/{owner}/{repo}/blob/{branch}/{path}`.
- Breadcrumb `repo / folder / folder / **file**`. Repo link resets to home; folder links scroll-and-open the matching `<details>` in the sidebar.
- **Rendered / Raw** toggle — only for `md`, `html`, `htm`. Persist per extension as `viewPref:{ext}`. Toggle flips `display` between sibling `#viewRendered` and `#viewRaw`.
- **📋 Copy** — `navigator.clipboard.writeText(lastRawText)`; show `✓ Copied` for 1.5s.
- **↗ New Tab** — opens `raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`.

## File rendering by extension

- **`.md`** — `DOMPurify.sanitize(marked.parse(text))`. After rendering, rewrite every `<a href>`:
  - Anchor links (`#…`) untouched.
  - External `http(s)` → `target="_blank" rel="noopener"`.
  - GitHub `blob/` URLs pointing at current `owner/repo/branch` → strip href, click navigates in-app via `selectFile(path)`.
  - Relative paths → resolve against the current file's directory (handle `./`, `../`, root-relative `/foo`) → in-app navigation.
- **`.html` / `.htm`** — put the text in a Blob, create an object URL, inject into `<iframe sandbox="allow-scripts" src="{blobUrl}">`. No `allow-same-origin`.
- **Images** (png/jpg/jpeg/gif/webp/svg/ico) — `<img>`. For SVG, also support the Raw toggle showing the XML.
- **Everything else (code / text)** — `hljs.highlightElement()` inside `<pre><code>`. Skip highlighting above 500KB (just escape and dump).

## Fetching file content

1. Try a **text cache** (`Map`, LRU, cap 25 entries, skip individual texts over 300 000 chars).
2. Else fetch:
   - With token: `GET https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}` with `Accept: application/vnd.github.raw+json`.
   - No token: `GET https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`.
3. Store result in the cache.

For images loaded without a token, use the raw URL directly as the `<img src>`. With a token, fetch as a Blob and use a blob URL. Track every blob URL in a `Set` and revoke them before each new `selectFile` and on `beforeunload`.

`encodePath(path)` must split on `/` and `encodeURIComponent` each segment.

## File-open precedence on load

1. If `location.hash` non-empty: decode and select that path.
2. Else if `currentFile` in localStorage: select it.
3. Else auto-select the first `README.md` / `README.txt` (prefer one at repo root).

On successful select: update the URL hash (`#` + encoded path) — `pushState` the first time, `replaceState` after. Save path as `currentFile`. Bind `popstate` and `hashchange` to re-select.

## Error handling

- `selectFile` is try/catch; ignore `AbortError`; render other errors in red.
- `window.error` and `unhandledrejection` append a bordered error panel with a Reload button.

## Initialization

`init()` at end of `<script>`:

1. Restore dark mode, font size, sidebar width from localStorage.
2. Wire all listeners (header buttons, resizer, filter, tree click delegation, content-area click delegation for breadcrumbs/toggle/copy/new-tab, hash routing).
3. `await detectRepo()`.
4. If owner+repo resolved: update header (`document.title`, header title, GH icon href), fetch tree, then hash > lastPath > README.

## Visual polish

- Buttons: 6px radius, 0.2s opacity transition, `translateY(-1px)` on hover.
- Tree hover: `--hover-bg` background, 4px radius. Active file row: `--highlight-color` bg + white text.
- Semantic `<header>` / `<main>`.
- Keep it beginner-readable — a student should be able to follow the script end-to-end. Comments only where intent is non-obvious.

## Deliverable

A single `index.html` file. No separate CSS/JS. No README.
