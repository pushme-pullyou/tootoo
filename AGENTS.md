# TooToo — AI Agent Instructions

## Hard Constraints

- **Vanilla JavaScript only** — no frameworks, no jQuery, no build tools, no Node.js
- **Single-file HTML preferred** — HTML + CSS + JS inline in one `.html` file
- **Static hosting** — GitHub Pages or `file://` only, no backend
- **ES2020+** — `const` over `let`, arrow functions, template literals, async/await, no `var`, no classes, no `this`

## What This Repo Is

TooToo is a lightweight single-file GitHub repository browser. A `CONFIG` object at the top of the script sets `owner`, `repo`, and `branch`. The app auto-detects those values from GitHub Pages URLs, `.git/config` files, or localStorage.

Key file: [`tootoo-2026-lt/index.html`](tootoo-2026-lt/index.html) — the canonical current version.

See [`tootoo-2026-lt/README.md`](tootoo-2026-lt/README.md) for features, quick start, and project structure.

## Style Conventions

- CSS Custom Properties for all colors/sizes — see `:root` block near top of `<style>`
- Dark mode via `body.dark-mode` class toggling CSS variables
- `rem` units for font sizes; `var(--font-size)` on `html` so A−/A+ controls scale everything
- External CDN dependencies: `marked.min.js`, `highlight.js`, `DOMPurify`, `SheetJS`

## Development Workflow

- Numbered subfolders (`1-layout/`, `2-treeview/`, `3-content/`) contain standalone test files for each module — develop there, then merge into the single `index.html`
- Archive dated snapshots as `index-YYYY-MM-DD.html` before big rewrites
- Keep changelogs in `README.md` with dated bullet entries
- Track priorities in [`0-tootoo-agenda.md`](0-tootoo-agenda.md)

## Multi-Repo Note

Copies of TooToo exist in `theo-armour-sandbox/tootoo/tootoo-2026-lt/` and `theo-armour-pages/tootoo/`. Apply fixes consistently across all copies unless the fix is specific to one repo's `CONFIG`.
