---
mode: agent
description: Merge changes from a numbered module subfolder back into the main index.html
---

Merge the code from a numbered module subfolder into `tootoo-2026-lt/index.html`.

## Instructions

The numbered subfolders (`1-layout/`, `2-treeview/`, `3-content/`) each contain a standalone test HTML file for one section of the app. When changes in a module are ready, they need to be merged back into the single `index.html`.

1. Read the standalone module file in `tootoo-2026-lt/${input:module:Module subfolder, e.g. 1-layout}/`
2. Read `tootoo-2026-lt/index.html`
3. Identify the section in `index.html` that corresponds to the module (look for matching CSS block, JS function names, or HTML structure)
4. Splice in only the changed portions — do **not** replace unrelated sections
5. Preserve the `<!-- ── N. SectionName ── -->` comment markers that delimit sections in the JS
6. Before writing, archive the current `index.html` as `index-YYYY-MM-DD.html` (today's date) if one does not already exist for today

## Constraints

- Vanilla JavaScript only — no frameworks introduced
- Keep all CSS Custom Properties in the `:root` block; do not inline colors or sizes
- Preserve the `meta name="revised"` tag and update it to today's date/time
