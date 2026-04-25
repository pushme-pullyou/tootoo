---
mode: agent
description: Apply a focused staged merge into the current TooToo index.html
---

# TooToo Merge

Merge a focused change, prototype, or external HTML slice back into the current root `index.html`.

## Instructions

Use this prompt when you already have a source change you want merged into the canonical TooToo app without rewriting unrelated parts.

1. Read the source file or source folder the user names: `${input:source:Source file or folder to merge from, e.g. test-cases/sample-page.html}`
2. Read the canonical app at `index.html`
3. Read `AGENTS.md` and follow the backup rule before the first save to `index.html`
4. Identify the corresponding section in `index.html` using matching CSS blocks, HTML structure, helper names, or JS comment markers
5. Splice in only the changed portions — do **not** replace unrelated sections
6. Preserve existing architecture, helper functions, storage keys, and section comment markers when present
7. Validate the touched slice immediately after the merge

## Constraints

- Vanilla JavaScript only — no frameworks introduced
- Keep all CSS Custom Properties in the `:root` block; do not inline colors or sizes
- Preserve the `meta name="revised"` tag and update it to today's date/time
- Treat the root `index.html` as canonical; do not target the old `tootoo-2026-lt/` path
