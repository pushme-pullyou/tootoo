# TooToo Dev

Working copy of TooToo for experiments. **Edit here, not in production.**

## Production / Dev split

| Stage          | File                      | Identity (`appName`) | Purpose                          |
| -------------- | ------------------------- | -------------------- | -------------------------------- |
| **Production** | `../index.html`           | `TooToo`             | Stable, canonical, what ships    |
| **Dev**        | `tootoo-dev/index.html`   | `TooToo Dev`         | Sandbox for in-progress changes  |

The Dev copy says **"TooToo Dev"** in the browser tab, header, and About box, so you always know which one you're looking at.

## Workflow — three chat commands

Full spec in [PIPELINE.md](../PIPELINE.md). In short, type one word in chat:

| Command | Does |
| --- | --- |
| `promote` | Dev `index.html` → this repo's production `index.html` (backs up, strips dev identity, auto-writes the README changelog). |
| `sync` | Production `index.html` → all downstream vendored copies (plain copy; never touches their `tootoo.config.js`). |
| `publish` | Commits + pushes every changed repo so its GitHub Pages site rebuilds. Confirms first — the only command that does git pushes. |

Edit only in `tootoo-dev/index.html`; test via `file://`; then `promote` → `sync` → `publish`.

## Journal

- **2026-06-21** — Wrote [PIPELINE.md](../PIPELINE.md): the `promote` / `sync` / `publish` spec. Confirmed all 12 downstream copies keep customization in `tootoo.config.js`, so `index.html` is identical everywhere and sync is a safe plain copy.
- **2026-06-21** — Started the Production/Dev split. Created `tootoo-dev/index.html` as a copy of production `index.html` (revised 2026-06-16 23:39), retitled to "TooToo Dev".
