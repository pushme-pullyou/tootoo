# TooToo - AI Agent Instructions

Repo-local guidance for this project. These instructions override global defaults only where they are more specific.

## Hard Constraints

- Vanilla JavaScript only: no frameworks, no jQuery, no build tools, no Node.js.
- Single-file HTML preferred: HTML, CSS, and JavaScript inline in one `.html` file.
- Static hosting only: GitHub Pages or `file://`; no backend.
- ES2020+: prefer `const`, arrow functions, template literals, async/await; no `var`, no classes, no `this`.

## Karpathy Rules

1. Do not assume. Do not hide confusion. Surface tradeoffs.
2. Write the minimum code that solves the problem. Nothing speculative.
3. Touch only what you must. Clean up only your own mess.
4. Define success criteria. Loop until verified.

## What This Repo Is

TooToo is the canonical single-file app in this repository. Older/full TooToo files have moved to their own separate repository.

Key file: [`index.html`](index.html) - the canonical current app.

Reference files:

- [`README.md`](README.md) - features, quick start, project structure, and changelog.
- [`0-tootoo-agenda.md`](0-tootoo-agenda.md) - current priorities.
- [`0-tootoo-journal.md`](0-tootoo-journal.md) - recent notes.
- [`examples/`](examples/) - sample content and rendering-behavior fixtures, organized by file type.

## Style Conventions

- CSS custom properties for colors, sizes, and repeated values; keep them in the `:root` block near the top of `<style>`.
- Dark mode uses `body.dark-mode` to toggle CSS variables.
- Font sizing uses `rem`; `var(--font-size)` lives on `html` so the A-/A+ controls scale the app.
- External CDN dependencies are intentionally pinned: `marked`, `highlight.js`, `DOMPurify`, and `SheetJS`.
- Keep code beginner-readable and consistent with nearby code.

## Development Workflow

- Edit [`index.html`](index.html) directly; it is the canonical single-file app.
- On every save to [`index.html`](index.html), update `<meta name="revised" content="YYYY-MM-DD HH:MM">` using Pacific Time; the Files tooltip and About page read this value.
- Before non-trivial edits, define 2-4 concrete success checks, then verify them.
- Use the test and sample folders to exercise file rendering behavior when relevant.
- Keep README changelog entries dated, newest first, when user-facing behavior changes.
- Track project priorities in [`0-tootoo-agenda.md`](0-tootoo-agenda.md).

## Backup Rule

Before editing the canonical app, create or update a dated backup snapshot.

- Canonical app: [`index.html`](index.html)
- Backup format: `index-YYYY-MM-DD-HH-MM.html`
- Place backups in the repository root unless the task explicitly says to use `.archive/`.
- If a backup for the current timestamp already exists, update that backup rather than creating a near-duplicate.
- Keep backups as complete copies of `index.html`, not patches or partial excerpts.

## Multi-Repo Note

Do not apply TooToo fixes to older/full TooToo copies or sibling repositories unless the task explicitly asks for cross-repo synchronization.
