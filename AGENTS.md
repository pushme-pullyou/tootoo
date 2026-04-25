# TooToo — AI Agent Instructions

## Hard Constraints

- **Vanilla JavaScript only** — no frameworks, no jQuery, no build tools, no Node.js
- **Single-file HTML preferred** — HTML + CSS + JS inline in one `.html` file
- **Static hosting** — GitHub Pages or `file://` only, no backend
- **ES2020+** — `const` over `let`, arrow functions, template literals, async/await, no `var`, no classes, no `this`

## What This Repo Is

TooToo (formerly "TooToo LT") is the canonical app in this repository. The older/full TooToo files have been moved to their own separate repository.

TooToo is a lightweight single-file GitHub repository browser. A `CONFIG` object at the top of the script sets `owner`, `repo`, and `branch`. The app auto-detects those values from GitHub Pages URLs, `.git/config` files, URL query parameters, or localStorage.

Key file: [`index.html`](index.html) — the canonical current version.

See [`README.md`](README.md) for features, quick start, and project structure. Use [`0-tootoo-agenda.md`](0-tootoo-agenda.md) for priorities and [`0-tootoo-journal.md`](0-tootoo-journal.md) for recent notes.

## Style Conventions

- CSS Custom Properties for all colors/sizes — see `:root` block near top of `<style>`
- Dark mode via `body.dark-mode` class toggling CSS variables
- `rem` units for font sizes; `var(--font-size)` on `html` so A−/A+ controls scale everything
- External CDN dependencies: `marked.min.js`, `highlight.js`, `DOMPurify`, `SheetJS`

## Development Workflow

- Edit [`index.html`](index.html) directly; it is the canonical single-file app
- Use [`test-cases/`](test-cases/) and [`sample-folders-and-files/`](sample-folders-and-files/) to exercise file rendering behavior
- Archive dated snapshots as `index-YYYY-MM-DD-HH-MM.html` before larger rewrites
- Keep changelogs in `README.md` with dated bullet entries
- Track priorities in [`0-tootoo-agenda.md`](0-tootoo-agenda.md)

## Backup Rule

Before saving edits to the canonical app, create or update a dated backup snapshot.

- Canonical app: [`index.html`](index.html)
- Backup format: `index-YYYY-MM-DD-HH-MM.html`
- Place backups in the repository root unless a task explicitly says to use `.archive/`
- If a backup for the current timestamp already exists, update that backup rather than creating a near-duplicate
- Keep backups as complete copies of `index.html`, not patches or partial excerpts

## Multi-Repo Note

Older/full TooToo files have moved to their own repository. Do not apply TooToo fixes to old copies unless the task explicitly asks for cross-repo synchronization.
