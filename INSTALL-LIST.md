# TooToo install list

Theo's own installs of TooToo, as a checklist: where each one lives and which release it runs. It is for convenience only. Strangers never need it, and nothing pushes to the installs it lists (SPEC.md §8). The `update <install>` command moves one install to the latest release and updates its row.

Copied 2026-11-22 from `pushme-pullyou-dolittle/INSTALL-LIST.md`, leaving out `Julia-Morgan-Building.github.io`: its `index.html` is a hand-customized Hub build, and its `index-tootoo.html` waits for the Hub view. All 16 ran r1 then; since 2026-11-23 they run r3. The 17th row, added 2026-11-22, is this workshop's own root `index.html`: it runs the latest build (`dev`), which `assemble.ps1` refreshes, so it never needs `update`.

| Local index.html path | Owner/repo | Branch | Release |
| --- | --- | --- | --- |
| `g:\My Drive\2026-theo-github\heritage-happenings.github.io\index.html` | heritage-happenings/heritage-happenings.github.io | master | r3 |
| `G:\My Drive\2026-theo-github\heritage-happenings-documents\index.html` | heritage-happenings/documents | main | r3 |
| `g:\My Drive\2026-theo-github\pushme-pullyou-assets\index.html` | pushme-pullyou/assets | main | r3 |
| `g:\My Drive\2026-theo-github\pushme-pullyou-github-io\index.html` | pushme-pullyou/pushme-pullyou.github.io | main | r3 |
| `g:\My Drive\2026-theo-github\theo-armour-github-io\index.html` | theo-armour/theo-armour.github.io | main | r4 |
| `g:\My Drive\2026-theo-github\theo-armour-2025\index.html` | theo-armour/2025 | main | r3 |
| `g:\My Drive\2026-theo-github\theo-armour-2026\index.html` | theo-armour/2026 | main | r3 |
| `g:\My Drive\2026-theo-github\theo-armour-aa\index.html` | theo-armour/aa | main | r3 |
| `g:\My Drive\2026-theo-github\theo-armour-agenda\index.html` | theo-armour/agenda | main | r3 |
| `g:\My Drive\2026-theo-github\theo-armour-collection\index.html` | theo-armour/collection | main | r4 |
| `g:\My Drive\2026-theo-github\theo-armour-genealogy\index.html` | theo-armour/genealogy | main | r3 |
| `g:\My Drive\2026-theo-github\theo-armour-pages\index.html` | theo-armour/pages | main | r3 |
| `g:\My Drive\2026-theo-github\theo-armour-qdata\index.html` | theo-armour/qdata | main | r3 |
| `g:\My Drive\2026-theo-github\theo-armour-sandbox\index.html` | theo-armour/sandbox | main | r4 |
| `g:\My Drive\2026-theo-github\theo-armour-wikitheo\index.html` | theo-armour/wikitheo | main | r3 |
| `g:\My Drive\2026-theo-github\pushme-pullyou-tootoo\index.html` | pushme-pullyou/tootoo | main | dev (every build) |
| `j:\My Drive\tech\index.html` | heritage-happenings/tech | main | r3 |

## Notes

- **Migration (done):** `theo-armour-sandbox` piloted r2 on 2026-11-22, then r3; the other 15 moved from r1 straight to r3 on 2026-11-23.
- **Private repos:** don't publish Pages for a private repo (`theo-armour/agenda`, `theo-armour/aa`): a Pages site is public, so its files are readable by URL without a token. Browse them with TooToo locally, or from another install with a token.
- **`tech`:** its Google Drive letter can change between machines (it has been `i:` and `j:`). A "missing" install usually means a new drive letter, not a deleted one.
- **Adding an install:** add a row with its path, `owner/repo`, branch and release.
