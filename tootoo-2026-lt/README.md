# TooToo LT

A lightweight single-file GitHub repository browser. Drop it into any repo folder and it auto-detects the repository — or run it on GitHub Pages.

* Live: <https://pushme-pullyou.github.io/tootoo/tootoo-2026-lt/>
* Source: <https://github.com/https://pushme-pullyou/tootoo/tree/main/tootoo-2026-lt>
* https://pushme-pullyou.github.io/tootoo/tootoo-2026-lt/?owner=obadawy&repo=lmsgsrv
* https://pushme-pullyou.github.io/tootoo/tootoo-2026-lt/?owner=pushme-pullyou&repo=pushme-pullyou.github.io

## Features

* **Single file** — one `tootoo-lt.html` with HTML, CSS, and JS inline
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

## Quick Start

**On GitHub Pages** — just visit the live URL above.

**Drop-in mode** — copy `tootoo-lt.html` into any GitHub repo folder. Open it in a browser. It walks up the directory tree looking for `.git/config` to find the owner and repo.

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

```
tootoo-2026-lt/
  tootoo-lt.html          ← the app
  tootoo-lt-prompt.md     ← full prompt spec for generating the app
  1-layout/               ← layout shell (HTML/CSS + repo detection)
  2-treeview/             ← tree rendering module
  3-content/              ← file content viewer module
```

The numbered folders contain modular prompts and standalone test files for developing each section independently before merging into the single `tootoo-lt.html`.

## License

MIT — Copyright pushme-pullyou

## Change Log

* 2026-04-09 — Help button with live rate limit, tips section
* 2026-04-09 — GitHub Pages URL auto-detection, file:// XHR detection
* 2026-04-07 — Style adjustments, about button
* 2026-04-06 — New tab: use raw URL when not on Pages
