---
mode: agent
description: Rebuild or extend TooToo in staged passes using the current root index.html
---

# TooToo Rebuild

Rebuild or extend the current TooToo app in staged passes.

## Inputs

- Goal: ${input:goal:What do you want to change, add, or repair?}
- Scope: ${input:scope:Which areas are in scope? e.g. tree, routing, markdown, layout, all:all}

## Working Files

- Canonical app: `index.html`
- Agent guidance: `AGENTS.md`
- Project docs: `README.md`, `0-tootoo-agenda.md`, `0-tootoo-journal.md`
- Rebuild notes: `RECREATE-PROMPT.md`
- Local fixtures: `test-cases/`, `sample-folders-and-files/`

## Workflow

1. Read the current app and the relevant guidance files before editing. Do not regenerate the whole file blindly.
2. Before the first save to `index.html`, create or update a dated backup snapshot in the repo root using the format `index-YYYY-MM-DD-HH-MM.html`.
3. Break the work into stages and complete them in order:
   - Stage 1: identify the affected sections and constraints
   - Stage 2: plan the smallest coherent change for the touched slice
   - Stage 3: implement one slice in `index.html`
   - Stage 4: validate immediately after each substantive edit
   - Stage 5: continue with adjacent slices until the goal is complete
   - Stage 6: update the `meta name="revised"` timestamp and any docs/changelog entries that should change with the feature
4. Prefer small targeted edits to existing sections. Reuse current helpers, storage keys, event wiring, and conventions.
5. If the request is large, finish one stage cleanly, validate it, then continue. Do not restart from scratch unless the current approach is clearly wrong.

## Constraints

- Vanilla JavaScript only — no frameworks, no build tools, no Node.js
- Keep `index.html` as the canonical single-file app
- Preserve CSS custom properties in the `:root` block
- Keep `CONFIG` and `state` as the main configuration and state objects unless the change clearly requires a minimal extension
- Maintain support for both `file://` usage and GitHub Pages hosting
- Keep HTML previews safe by default; do not loosen the iframe sandbox unless the user explicitly asks for it
- Avoid rewriting unrelated sections just because the file is large

## Validation

- After each substantive edit, run the narrowest available validation for the touched slice before continuing
- At minimum, check the edited files for errors
- If a change affects links, paths, or prompts, verify those references point at current repo files

## Deliverable

Complete the requested TooToo change in the current repo using staged edits to the existing root `index.html`, not a full blind rewrite.
