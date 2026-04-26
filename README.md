# TooToo

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://pushme-pullyou.github.io/tootoo/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Single File](https://img.shields.io/badge/single--file-vanilla%20JS-orange)](index.html)

**Browse any GitHub repo in your browser. Zero install. One HTML file.**

![TooToo screenshot](docs/screenshot.png)

> *(Replace `docs/screenshot.png` with a real screenshot — best showing the file tree, a rendered Markdown file, and dark mode.)*

## Try it

| Try | What it demos |
| --- | --- |
| [octocat/hello-world](https://pushme-pullyou.github.io/tootoo/?owner=octocat&repo=hello-world) | Tiny repo — see the basic UI in two seconds |
| [facebook/react @ React README](https://pushme-pullyou.github.io/tootoo/?owner=facebook&repo=react#packages/react/README.md) | Big repo, deep-linked to a specific file |
| [openai/openai-cookbook](https://pushme-pullyou.github.io/tootoo/?owner=openai&repo=openai-cookbook) | Markdown-heavy repo with notebooks |
| [torvalds/linux @ master](https://pushme-pullyou.github.io/tootoo/?owner=torvalds&repo=linux&branch=master) | Stress test — token recommended for big trees |

<details>
<summary>More demos</summary>

* <https://pushme-pullyou.github.io/tootoo/?owner=microsoft&repo=vscode>
* <https://pushme-pullyou.github.io/tootoo/?owner=anthropics&repo=claude-code>
* <https://pushme-pullyou.github.io/tootoo/?owner=d3&repo=d3#API.md>
* <https://pushme-pullyou.github.io/tootoo/?owner=xai-org&repo=grok-1>
* <https://pushme-pullyou.github.io/tootoo/?owner=xai-org&repo=grok-prover-v1>
* <https://pushme-pullyou.github.io/tootoo/?owner=openai&repo=whisper>
* <https://pushme-pullyou.github.io/tootoo/?owner=openai&repo=openai-python>
* <https://pushme-pullyou.github.io/tootoo/?owner=pushme-pullyou&repo=pushme-pullyou.github.io>

</details>

## Why TooToo?

* **Instant cross-tree filter.** Type a few letters, see every matching path. GitHub's web UI only filters the current folder.
* **Sticky sidebar, sticky breadcrumbs.** Scroll a long file without losing context.
* **Built for phones too.** A−/A+ buttons resize everything; the sidebar collapses to a sensible width on narrow screens; dark mode is one tap.
* **Works next to a local checkout.** Drop `index.html` next to a cloned repo and TooToo reads it from disk via `file://` — no API quota burn, no internet required.
* **Drag-and-drop friendly.** One file. Copy it into any repo, push, enable Pages, done.

## Features

* **Single file** — one `index.html` with HTML, CSS, and JS inline
* **Auto-detect** — reads `.git/config`, parses GitHub Pages URLs, or caches to localStorage
* **File tree** — sidebar with collapsible folders, filter input, keyboard navigation
* **Content viewer** — Markdown (rendered via marked), syntax-highlighted code, images, audio, video, PDF, spreadsheets (SheetJS)
* **Dark mode** — toggle with persisted preference
* **Resizable sidebar** — drag to resize, width saved across visits
* **Font size controls** — A−/A+ buttons, helpful on phones
* **GitHub token support** — optional PAT for private repos and higher rate limits (5,000/hr vs 60/hr)
* **File text cache** — LRU in-memory + localStorage cache to reduce API calls
* **Hash routing** — deep-link to any file via `#path/to/file`
* **Copy / New Tab** — copy raw file content or open the GitHub Pages URL
* **Rendered ↔ Raw toggle** — for Markdown, HTML, and SVG files; preference saved per file type
* **Safer HTML previews** — rendered HTML uses a strict iframe sandbox so repository scripts do not run by default

## Quick Start

**On GitHub Pages** — visit the [live URL](https://pushme-pullyou.github.io/tootoo/) above.

**Drop-in mode** — copy `index.html` into any GitHub repo folder. Open it in a browser. It walks up the directory tree looking for `.git/config` to find the owner and repo.

**Pre-configured** — edit the `CONFIG` object at the top of the script:

```js
const CONFIG = {
  owner: 'pushme-pullyou',
  repo: 'tootoo',
  branch: 'main',
  storagePrefix: 'tootoo',
  appName: 'TooToo',
  sourceRepoUrl: 'https://github.com/pushme-pullyou/tootoo',
};
```

## Fork & Customize

Want your own TooToo pointing at your own repo? It takes about a minute.

1. **Fork** this repository on GitHub (top-right of the repo page).
2. **Edit `CONFIG`** at the top of the `<script>` block in [`index.html`](index.html):

   ```js
   const CONFIG = {
     owner: '',                  // optional: pre-load a specific repo
     repo: '',
     branch: '',                 // empty = use the default branch
     storagePrefix: 'mybrowser', // localStorage namespace
     appName: 'MyBrowser',       // <title> + About heading
     sourceRepoUrl: 'https://github.com/you/your-fork', // file:// fallback for the header
   };
   ```

   On GitHub Pages, the top-header label and link auto-detect from the hostname (`<you>.github.io/<fork>/`), so you don't even need to set `sourceRepoUrl` for the Pages deploy. It's only used as a fallback for `file://` and custom domains.

3. **Customize the favicon** (optional) — the inline SVG `<link rel="icon" ...>` in `<head>`.

4. **Enable Pages**: in your fork's *Settings → Pages*, deploy from the `main` branch root. Your fork goes live at `https://<you>.github.io/<your-fork>/`.

For deeper customization (adding renderers, new buttons, etc.), see [`FORKING.md`](FORKING.md) — covers the architecture, render pipelines, and the gotchas (file://, rate limits, blob lifecycle).

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

To wipe state, click ⚙️ Token → **Reset all TooToo data**, or run `localStorage.clear()` in DevTools.

## Constraints

* Vanilla JavaScript — no frameworks, no build tools, no Node.js
* ES2020+ — `const`/`let`, arrow functions, template literals, async/await
* Static hosting only — GitHub Pages or open from `file://`
* External CDN deps: marked, highlight.js, DOMPurify, SheetJS

## Project Structure

```text
index.html                    ← canonical single-file app
README.md                     ← user-facing docs (this file)
FORKING.md                    ← architecture + recipes for forkers
AGENTS.md                     ← AI agent guidance
CLAUDE.md                     ← Claude-specific pointer file
0-tootoo-agenda.md            ← priorities and ideas
0-tootoo-journal.md           ← development notes
tootoo-test.html              ← standalone test harness for pure helpers
test-cases/                   ← file rendering fixtures (with index README)
sample-folders-and-files/     ← sample local tree content
.archive/                     ← older snapshots
.github/prompts/              ← generation/merge/rebuild prompts
gemini/                       ← alternate-model experiments
```

## License

MIT — Copyright pushme-pullyou. See [`LICENSE`](LICENSE).

## Change Log

* 2026-04-25 — Top-header label and GitHub icon now derive from `APP_ORIGIN` (where this app instance is hosted), independent of the currently browsed repo; on `file://` it reads the surrounding `.git/config`
* 2026-04-25 — Token panel auto-opens on rate-limit (403) with explanation of why a token is needed and where to get one
* 2026-04-25 — Pinned CDN versions (marked@12.0.2, dompurify@3.4.1, xlsx@0.20.3) to insulate against upstream breakage
* 2026-04-25 — README auto-select now matches more variants (`README`, `README.markdown`, `README.mkd`, `README.mdown`, `README.txt`); falls back to the About page if no root README exists
* 2026-04-25 — `probeLocalMode` now respects the abort signal so probes stop when the user navigates away mid-load
* 2026-04-25 — Filter and visible-tree-item logic now use an `.is-hidden` class instead of inline-style sniffing
* 2026-04-25 — View-toggle buttons (Rendered/Raw) drive their styling from `aria-pressed` instead of inline `style="opacity:..."`
* 2026-04-25 — Removed duplicate `/` keyboard handler; merged the two `beforeunload` listeners
* 2026-04-25 — Active tree-item scroll uses `behavior: 'auto'` so rapid keyboard navigation no longer fights smooth-scroll
* 2026-04-25 — `renderCode` now always builds via `textContent`, skipping the escape pass for very large files
* 2026-04-25 — Configured defaults now act as a fallback after repo auto-detection instead of short-circuiting URL, cache, Pages, and .git/config detection
* 2026-04-25 — 403 responses in repo-info and authenticated file fetches now surface the same rate-limit warning used by tree loading
* 2026-04-25 — Repo breadcrumb now resets to a true home state instead of leaving the previously opened file view onscreen
* 2026-04-25 — Last-opened file persistence is now scoped per owner/repo/branch and ignores stale paths not present in the current tree
* 2026-04-25 — Markdown now resolves relative image paths against the current file location in the repository browser
* 2026-04-25 — Renamed: the app is now simply "TooToo" (the previous "LT" suffix is dropped); older/full TooToo files moved to their own repository
* 2026-04-25 — HTML rendered previews now use a strict sandbox so repository scripts do not run by default
* 2026-04-09 — Help button with live rate limit, tips section
* 2026-04-09 — GitHub Pages URL auto-detection, file:// XHR detection
* 2026-04-07 — Style adjustments, About button
* 2026-04-06 — New tab: use raw URL when not on Pages
