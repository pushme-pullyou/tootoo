# TooToo Next

The rebuild of TooToo, the single-file GitHub repository viewer, and of the Dolittle workshop that builds it. In the new design, each install keeps its own self-contained `index.html`, with its settings in a marked config block, and pulls numbered releases when it chooses. Nothing is pushed out to the installs. Today's TooToo, in `pushme-pullyou-dolittle` and `pushme-pullyou-tootoo`, keeps running on release r1 until this replaces it.

* [SPEC.md](SPEC.md): the specification.
* [BUILD-PROMPT.md](BUILD-PROMPT.md): the staged build prompt for an AI agent ("build stage N").
* [AGENTS.md](AGENTS.md): the rules for agents, and the workshop commands.
* [INSTALL-LIST.md](INSTALL-LIST.md): Theo's installs and the release each runs.
* [0-tootoo-next-journal.md](0-tootoo-next-journal.md): the development journal.

## Open it

* **The app from source:** double-click [src/index.html](src/index.html). On `file://` it offers to open a folder, or to browse GitHub. Add `?source=mock` to browse the test mock instead.
* **The release file:** `pwsh -File assemble.ps1` writes `build/index.html` (`-Release r2` stamps a release number).

## Test it

* `pwsh -File run-tests.ps1` builds, then runs the suite in headless Chrome twice: on `src/`, and inside `build/index.html`. Each run prints `PASS n / FAIL n`, followed by line counts against the 2,500-line budget. The CDN libraries need the network.
* Or open [tests/index.html](tests/index.html) (`?release=1` for the build) in Chrome.
* Before a release: [tests/live.html](tests/live.html) against the real GitHub API, and [tests/CHECKLIST.md](tests/CHECKLIST.md) by hand.

## Changelog

### 2026-11-22

* v1 built in seven stages (0–6) from the build prompt: the scaffold and tests; config, state and router; the GitHub and local sources; shell, tree, content and the Browser view; the loaders; the update check and the swap; release mode and docs.
* The suite has 75 tests on `src/`, and the same tests plus 4 release checks inside the build. `live.html` has 5.
* Ready to release as r2, once the live page and the checklist pass.

### 2026-11-21

* Folder created. Spec skeleton drafted with the first eight decisions.
* Spec settled (32 decisions). Browser tests run for the folder picker and the `file://` fetch. Build prompt drafted.
