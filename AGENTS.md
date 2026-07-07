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

**`pushme-pullyou-tootoo` is the canonical home of TooToo — the single source of truth.** Every other TooToo installation (in `heritage-happenings.github.io`, the `theo-armour-*` repos, the other `pushme-pullyou-*` repos, `i:\My Drive\tech`, and any future copy) is a **fork**: a generated, vendored copy of this repo's `index.html`. Forks are outputs, never sources. See the **Canonical Source & Forks** section below and [`PIPELINE.md`](PIPELINE.md) for how changes flow out to them.

Key file: [`index.html`](index.html) - the canonical production app.

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

- **Don't hand-edit the production [`index.html`](index.html) — it is a generated artifact.** All changes are made in [`tootoo-dev/`](tootoo-dev/) and tested via `file://`, then `promote` regenerates production `index.html` and `sync` / `publish` fan it out to the forks. See [`PIPELINE.md`](PIPELINE.md) for the full flow.
- The `<meta name="revised" content="YYYY-MM-DD HH:MM">` stamp (Pacific Time) on production `index.html` is written by `promote`; the Files tooltip and About page read this value.
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

## Canonical Source & Forks

This repo is canonical. All other TooToo installs are forks that carry a generated copy of this repo's `index.html`.

- **Edit canonical only.** Make every TooToo change here, never in a fork. A fork's `index.html` is a build artifact — hand-editing it is overwritten on the next sync and diverges the fork from the source.
- **Per-fork differences live in `tootoo.config.js`,** not in `index.html`. Each fork's branding (owner/repo, appName, theme) comes from its own `tootoo.config.js`; the app code stays byte-identical across every copy. No process step ever edits a fork's `tootoo.config.js`.
- **Changes flow one way:** edit in `tootoo-dev/` → `promote` (regenerates canonical production `index.html`) → `sync` (copies it to every fork) → `publish` (commits + pushes). This is specified in [`PIPELINE.md`](PIPELINE.md); the authoritative fork/target list is [`PIPELINE.md` §5](PIPELINE.md).
- **Don't fan out by hand.** Do not apply a fix directly to forks or sibling repos unless the task explicitly asks for cross-repo sync — that is what `sync`/`publish` are for.
