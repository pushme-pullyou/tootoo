# TooToo LT

2026-04-25 12:26

TooToo LT is now the primary TooToo in this repository. The older/full TooToo files have moved to their own repository.

A lightweight single-file GitHub repository browser. Drop it into any repo folder and it auto-detects the repository — or run it on GitHub Pages.

* Live: <https://pushme-pullyou.github.io/tootoo/>
* Source: <https://github.com/pushme-pullyou/tootoo>
* <https://pushme-pullyou.github.io/tootoo/?owner=obadawy&repo=lmsgsrv>
* <https://pushme-pullyou.github.io/tootoo/?owner=pushme-pullyou&repo=pushme-pullyou.github.io>

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

* 2026-04-25 — Configured defaults now act as a fallback after repo auto-detection instead of short-circuiting URL, cache, Pages, and .git/config detection
* 2026-04-25 — 403 responses in repo-info and authenticated file fetches now surface the same rate-limit warning used by tree loading
* 2026-04-25 — About now links to the canonical root TooToo source instead of the removed `tootoo-2026-lt` subfolder
* 2026-04-25 — Repo breadcrumb now resets to a true home state instead of leaving the previously opened file view onscreen
* 2026-04-25 — Last-opened file persistence is now scoped per owner/repo/branch and ignores stale paths not present in the current tree
* 2026-04-25 — Markdown now resolves relative image paths against the current file location in the repository browser
* 2026-04-25 — TooToo LT is now the primary TooToo in this repo; older/full TooToo files moved to their own repository
* 2026-04-25 — Added backup rule for dated `index.html` snapshots before app edits
* 2026-04-25 — HTML rendered previews now use a strict sandbox so repository scripts do not run by default
* 2026-04-09 — Help button with live rate limit, tips section
* 2026-04-09 — GitHub Pages URL auto-detection, file:// XHR detection
* 2026-04-07 — Style adjustments, about button
* 2026-04-06 — New tab: use raw URL when not on Pages
