# TooToo

2026-04-25 19:45

A lightweight single-file GitHub repository browser. Drop it into any repo folder and it auto-detects the repository — or run it on GitHub Pages.

TooToo is now the primary TooToo in this repository. The older/full TooToo files have moved to their own repository.

* Live: <https://pushme-pullyou.github.io/tootoo/>
* Source: <https://github.com/pushme-pullyou/tootoo>
* https://pushme-pullyou.github.io/tootoo/?owner=octocat&repo=hello-world
* <https://pushme-pullyou.github.io/tootoo/?owner=pushme-pullyou&repo=pushme-pullyou.github.io>
* https://pushme-pullyou.github.io/tootoo/?owner=microsoft&repo=vscode
* https://pushme-pullyou.github.io/tootoo/?owner=facebook&repo=react#packages/react/README.md
* https://pushme-pullyou.github.io/tootoo/?owner=torvalds&repo=linux&branch=master
* https://pushme-pullyou.github.io/tootoo/?owner=anthropics&repo=claude-code
* https://pushme-pullyou.github.io/tootoo/?owner=d3&repo=d3#API.md
* https://pushme-pullyou.github.io/tootoo/?owner=xai-org&repo=grok-1
* https://pushme-pullyou.github.io/tootoo/?owner=xai-org&repo=grok-prover-v1
* https://pushme-pullyou.github.io/tootoo/?owner=openai&repo=openai-cookbook
* https://pushme-pullyou.github.io/tootoo/?owner=openai&repo=whisper
* https://pushme-pullyou.github.io/tootoo/?owner=openai&repo=openai-python

## Features

* **Single file** — one `index.html` with HTML, CSS, and JS inline
* **Auto-detect** — reads `.git/config`, parses GitHub Pages URLs, or caches to localStorage
* **File tree** — sidebar with collapsible folders, filter input, keyboard navigation
* **Content viewer** — Markdown (rendered via marked.js), syntax-highlighted code, images, audio, video, PDF, spreadsheets (SheetJS)
* **Dark mode** — toggle with persisted preference
* **Resizable sidebar** — drag to resize, width saved across visits
* **Font size controls** — A−/A+ buttons, helpful on phones
* **GitHub token support** — optional PAT for private repos and higher rate limits (5000/hr vs 60/hr)
* **File text cache** — LRU in-memory + localStorage cache to reduce API calls
* **Hash routing** — deep-link to any file via `#path/to/file`
* **Copy / New Tab** — copy raw file content or open the GitHub Pages URL
* **Rendered ↔ Raw toggle** — for Markdown, HTML, and SVG files; preference saved per file type
* **Safer HTML previews** — rendered HTML uses a strict iframe sandbox so repository scripts do not run by default

## Quick Start

**On GitHub Pages** — just visit the live URL above.

**Drop-in mode** — copy `index.html` into any GitHub repo folder. Open it in a browser. It walks up the directory tree looking for `.git/config` to find the owner and repo.

**Pre-configured** — edit the `CONFIG` object at the top of the script:

```js
const CONFIG = {
  owner: 'pushme-pullyou',
  repo: 'tootoo',
  branch: 'main',
};
```

## Fork & Customize

Want your own TooToo pointing at your own repo? It takes about a minute.

1. **Fork** this repository on GitHub (top-right of the repo page).
2. **Edit `CONFIG`** at the top of the `<script>` block in [`index.html`](index.html):

   ```js
   const CONFIG = {
     owner: 'your-github-username',
     repo: 'your-repo-name',
     branch: '',   // leave empty to use the default branch
   };
   ```

3. **Customize the chrome** (optional):
   * `<title>TooToo</title>` in `<head>` — the browser tab name
   * `<a id="headerTitle" ...>TooToo</a>` in `<header>` — the visible app name
   * The inline SVG favicon (`<link rel="icon" ...>` in `<head>`) — change the colors or letters
4. **Enable Pages**: in your fork's *Settings → Pages*, deploy from the `main` branch root. Your fork will be live at `https://<you>.github.io/<your-fork>/`.

You don't have to set `CONFIG` at all if you'd rather keep auto-detection — TooToo finds the repo from the GitHub Pages URL automatically. Hardcoding `CONFIG` is just a shortcut for forks that want to skip detection or pre-load a specific repo.

For forks that want to add features or change behavior, see [`FORKING.md`](FORKING.md) — it covers the architecture, where each render pipeline lives, and the gotchas (file://, rate limits, blob lifecycle).

### localStorage keys

TooToo stores everything in the browser's `localStorage`. All keys except the GitHub token are scoped per `location.pathname`, so two TooToo instances on the same origin keep separate state.

| Key | Purpose |
| --- | --- |
| `tootoo:<pathname>:repo` | Detected owner / repo / default branch |
| `tootoo:<pathname>:darkMode` | Dark mode on/off |
| `tootoo:<pathname>:fontSize` | Font size override (px) |
| `tootoo:<pathname>:sidebarWidth` | Last sidebar width (px) |
| `tootoo:<pathname>:fileTextCache` | LRU cache of recently viewed file contents |
| `tootoo:<pathname>:viewPref:<ext>` | Rendered / Raw toggle per file extension |
| `tootoo:<pathname>:currentFile:<owner>/<repo>/<branch>` | Last-opened file in that repo |
| `githubToken` | GitHub Personal Access Token (un-prefixed; shared across every TooToo instance on the origin) |

To wipe state, run `localStorage.clear()` in DevTools, or remove keys individually with `localStorage.removeItem('...')`.

## Constraints

* Vanilla JavaScript — no frameworks, no build tools, no Node.js
* ES2020+ — `const`/`let`, arrow functions, template literals, async/await
* Static hosting only — GitHub Pages or open from `file://`
* External CDN deps: marked, highlight.js, DOMPurify, SheetJS

## Project Structure

```text
index.html                    ← current single-file app
README.md                     ← user-facing docs
AGENTS.md                     ← AI agent guidance
CLAUDE.md                     ← Claude-specific pointer file
0-tootoo-agenda.md            ← priorities and ideas
0-tootoo-journal.md           ← development notes
RECREATE-PROMPT.md            ← prompt/spec for recreating the app
test-cases/                   ← file rendering fixtures
sample-folders-and-files/     ← sample local tree content
.archive/                     ← older snapshots
gemini/                       ← alternate/generated version experiments
```

## License

MIT — Copyright pushme-pullyou

## Change Log

* 2026-04-25 — Top header now permanently identifies the TooToo app (via `CONFIG.appName` and new `CONFIG.sourceRepoUrl`); the loaded repo's owner/branch moved into the lower-panel breadcrumbs with external GitHub links
* 2026-04-25 — Token panel auto-opens on rate-limit (403) with explanation of why a token is needed and where to get one
* 2026-04-25 — Pinned CDN versions (marked@12.0.2, dompurify@3.4.1, xlsx@0.20.3) to insulate against upstream breakage
* 2026-04-25 — Auto-open the About page when no root-level README exists, instead of hunting for a nested README
* 2026-04-25 — `probeLocalMode` now respects the abort signal so probes stop when the user navigates away mid-load
* 2026-04-25 — Filter and visible-tree-item logic now use an `.is-hidden` class instead of inline-style sniffing
* 2026-04-25 — View-toggle buttons (Rendered/Raw) drive their styling from `aria-pressed` instead of inline `style="opacity:..."`
* 2026-04-25 — Removed duplicate `/` keyboard handler; merged the two `beforeunload` listeners
* 2026-04-25 — Active tree-item scroll uses `behavior: 'auto'` so rapid keyboard navigation no longer fights smooth-scroll
* 2026-04-25 — `renderCode` now always builds via `textContent`, skipping the escape pass for very large files
* 2026-04-25 — Configured defaults now act as a fallback after repo auto-detection instead of short-circuiting URL, cache, Pages, and .git/config detection
* 2026-04-25 — 403 responses in repo-info and authenticated file fetches now surface the same rate-limit warning used by tree loading
* 2026-04-25 — About now links to the canonical root TooToo source instead of the removed `tootoo-2026-lt` subfolder
* 2026-04-25 — Repo breadcrumb now resets to a true home state instead of leaving the previously opened file view onscreen
* 2026-04-25 — Last-opened file persistence is now scoped per owner/repo/branch and ignores stale paths not present in the current tree
* 2026-04-25 — Markdown now resolves relative image paths against the current file location in the repository browser
* 2026-04-25 — Renamed: the app is now simply "TooToo" (the previous "LT" suffix is dropped); older/full TooToo files moved to their own repository
* 2026-04-25 — Added backup rule for dated `index.html` snapshots before app edits
* 2026-04-25 — HTML rendered previews now use a strict sandbox so repository scripts do not run by default
* 2026-04-09 — Help button with live rate limit, tips section
* 2026-04-09 — GitHub Pages URL auto-detection, file:// XHR detection
* 2026-04-07 — Style adjustments, about button
* 2026-04-06 — New tab: use raw URL when not on Pages
