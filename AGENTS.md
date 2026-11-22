# TooToo Next: rules for AI agents

This repo rebuilds TooToo, the single-file GitHub repository viewer, and will become the Dolittle workshop (SPEC.md decision 28). **[SPEC.md](SPEC.md) is the authority.** Read it before changing anything, then [0-tootoo-next-journal.md](0-tootoo-next-journal.md) for what was decided and learned since.

## Hard rules

- **Vanilla only.** HTML, CSS and ES2020+ JavaScript as classic `<script src>` files: no `import` / `export`, frameworks, build tools, Node, npm or Python. The only tools are PowerShell (`assemble.ps1`, `run-tests.ps1`) and headless Chrome.
- **Functional style.** `const` (`let` only when reassigned) and arrow functions. No `var`, classes or `this`. Each file defines one namespace object, and keeps its helpers inside it: every classic script shares one global scope.
- **Beginner-readable.** Plain names, short functions, and a one-line comment for any rule that isn't obvious. CSS custom properties go in `:root`; dark mode is `body.dark-mode`.
- **Size budget:** about 300 lines per file and about 2,500 lines of JS + CSS in `src/` (decision 23). `run-tests.ps1` prints the counts. If a change would break the budget, stop and say so.
- **Pinned CDN versions only.** marked and DOMPurify load at startup; anything else loads on demand through `loaders/index.js`.
- **No literal config markers in `src/` code.** Build them from parts (`'TOOTOO-CONFIG-' + 'START'`). `assemble.ps1` refuses a file that has one.
- **Touch only this repo,** except where a workshop command says otherwise.
- **No git commits or pushes** unless a command below says so and Theo confirms. `git add` is fine.
- **No features** beyond SPEC.md §6.

## Every change ends the same way

1. `pwsh -File run-tests.ps1` prints `FAIL 0` twice (the `src/` run and `?release=1`), with the line counts in budget.
2. A dated entry in the journal: `*` bullets with bold labels, saying what changed and anything learned.
3. A short report: the files changed, the `PASS / FAIL` lines, and anything in SPEC.md that turned out wrong.

## Workshop commands (SPEC.md §8)

Theo types them in chat; the agent runs the whole step and reports back.

| Command | Does | Writes git? |
| --- | --- | --- |
| `build` | `pwsh -File assemble.ps1` → `build/index.html` (gitignored) | No |
| `test` | `pwsh -File run-tests.ps1`: the suite on `src/`, then inside the build | No |
| `release` | Checks the release gate (SPEC.md §9: both test runs, [tests/live.html](tests/live.html), [tests/CHECKLIST.md](tests/CHECKLIST.md)). Then, in the `pushme-pullyou-tootoo` repo: writes `releases/rN/index.html` (`assemble.ps1 -Release rN`), updates `releases/latest.json`, and makes the root `index.html` the new release with tootoo's own block. Commits and pushes, creates the GitHub Release `rN — YYYY-MM-DD` with `index.html` attached, and tags `rN` here | Yes, after confirmation |
| `update <install>` | For one install in [INSTALL-LIST.md](INSTALL-LIST.md): takes the latest release, moves the install's config block into it (or pastes `tootoo.config.js` the first time), renames the old file to `index.bak`, and checks it via `file://`. Then shows the diff, and commits and pushes after confirmation. Updates the install's row | Yes, after confirmation |

Rules carried over from today's `release`: confirm before every git write; never force-push; never move or delete an `rN` tag, a GitHub Release or a `releases/rN/` folder.

## Where things are

- `src/`: the app. `src/index.html` is the dev page and runs straight from `file://`; `?source=mock` browses the test mock.
- `tests/`: [index.html](tests/index.html) (the suite; `?release=1` runs it inside the build), [live.html](tests/live.html) (the real GitHub API, by hand), [CHECKLIST.md](tests/CHECKLIST.md) (by hand), `mock-source.js`.
- `assemble.ps1` inlines `src/` into `build/index.html`. `run-tests.ps1` assembles, then runs both headless suites.
