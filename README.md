# TooToo Next

The rebuild of TooToo, the single-file GitHub repository viewer, and of the Dolittle workshop that builds it. This is a fresh start written from [SPEC.md](SPEC.md). In the new design each install keeps its own self-contained `index.html` and pulls numbered releases when it chooses. Nothing is pushed out to the installs. Today's TooToo, in `pushme-pullyou-dolittle` and `pushme-pullyou-tootoo`, keeps running on release r1 until this replaces it.

* [SPEC.md](SPEC.md): the specification, a draft.
* [BUILD-PROMPT.md](BUILD-PROMPT.md): the staged build prompt for an AI agent ("build stage N").
* [0-tootoo-next-journal.md](0-tootoo-next-journal.md): the development journal.

## Changelog

### 2026-11-21

* Folder created. Spec skeleton drafted with the first eight decisions.
* Spec settled (32 decisions). Browser tests run for the folder picker and the `file://` fetch. Build prompt drafted.
