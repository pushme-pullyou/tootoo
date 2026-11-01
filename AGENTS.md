# TooToo — AI Agent Instructions

This repo is the **published TooToo app**, not where TooToo is developed.

## The one rule

**Never hand-edit [`index.html`](index.html).** It is a generated build. The component
sources, assembler (`assemble.ps1`), tests, and the `promote` → `sync` → `publish`
release pipeline live in the **Dolittle workshop** repo
(`g:\My Drive\2026-theo-github\pushme-pullyou-dolittle`, GitHub
`pushme-pullyou/dolittle`). Make every code change there, rebuild, and let the
pipeline write this repo's `index.html`.

## What may be edited here

- `README.md`, `FORKING.md` — user-facing docs.
- `examples/` — sample content for the renderers.
- `tootoo.config.js` — this install's own branding. No pipeline command ever touches it.
- `favicon.ico`, `tootoo-screenshot.jpeg` — assets (the screenshot is refreshed by `promote`).

## Conventions

- Vanilla JavaScript, single file, static hosting, `file://` friendly — see the
  Constraints section of [`README.md`](README.md).
- README changelog entries are dated `YYYY-MM-DD`, newest first.
- History before 2026-10-31 is in the archive repo `pushme-pullyou/tootoo-2026-10`.
