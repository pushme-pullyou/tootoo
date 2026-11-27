# TooToo

TooToo, the single-file GitHub repository viewer: drop one `index.html` into a repo, and the repo becomes a browsable site. This repo is its workshop and its release host. Each install keeps its own self-contained `index.html`, with its settings in a marked config block, and pulls numbered releases when it chooses; nothing is pushed out to installs. TooToo is one animal in the [pushme-pullyou Menagerie](https://pushme-pullyou.github.io/#README.md), born in the [Dolittle](https://github.com/pushme-pullyou/dolittle) workshop.

## Get TooToo

The page at this repo's Pages address runs the **latest build**, for trying things out. For your own repo, take a **release**:

1. Download `index.html` from the [latest release](https://github.com/pushme-pullyou/tootoo/releases/latest) (or from `releases/rN/index.html`).
2. Put it in your repo. Opened from disk, it offers 📂 Open folder; on your Pages site, it browses that repo with no settings.
3. To brand it, edit the config block near the top (between `TOOTOO-CONFIG-START` and `TOOTOO-CONFIG-END`); every setting is listed there.
4. To update later: open it from disk, and when it says **rN available**, click **⬇ Download updated index.html**. Your config block carries over.

## Settings

Settings go in the config block, one line each, as `key: value,`. A fresh release's block is empty apart from a pointer here; a key left out uses its default. The full rules are in [SPEC.md](SPEC.md) §6.

| For | Settings |
| --- | --- |
| Which repo, and where it starts | `owner`, `repo`, `branch`, `startFile` |
| Name and look | `appName`, `subtitle`, `description`, `themeColor`, `headingFont`, `headingFontUrl`, `bodyFont`, `darkMode`, `faviconFile`, `homeUrl` |
| What the tree hides | `hiddenFolders`, `hiddenFiles`, `hideDatedBackups`, `autoOpenFolderReadme` |
| Footer | `rightsText`, `rightsOwners`, `links` |
| Search engines and updates | `noindex`, `checkForUpdates`, `updateUrl` |
| Saved choices | `storagePrefix`: give each install its own |

Two examples:

```js
startFile: '0-agenda.md',       // open this file first, not the README
links: [ { label: 'Pages', url: 'https://theo-armour.github.io/pages/' } ],   // shown in the footer and in About
```

`noindex: true` asks search engines not to list a site. It does not make anything private: a Pages site is readable by anyone who has the address.

## Private repos

TooToo can show a private repo without publishing anything. Don't turn on GitHub Pages for a private repo: a Pages site is public, so every file in it can be read by anyone with the address.

**1. Make a token.** On GitHub: Settings → Developer settings → [Fine-grained tokens](https://github.com/settings/personal-access-tokens/new). Limit it to the private repos you want to read, give it one permission, **Contents: Read-only**, and set an expiry date.

**2. Open the repo one of three ways.**

* **From its folder on your computer.** Double-click the repo's `index.html` and choose **📂 Open folder**. No token and no network: it reads the files on disk, including edits you haven't committed.
* **From GitHub, on your computer.** The same file, **Browse GitHub instead**, then ⚙️ to save the token.
* **From anywhere, a phone included.** Use any public TooToo as the viewer and name the repo in the address:

  `https://<owner>.github.io/?owner=<owner>&repo=<private-repo>`

  Press ⚙️ and save the token once in that browser. The public page holds none of your files; they travel only between GitHub and your browser. Bookmark the address.

**What to know.**

* The token is kept in that browser only, under the install's `storagePrefix`. Keep it read-only: other pages at the same site address could read a saved token.
* With a token, files come through GitHub's API, and pictures, PDFs, audio and video are shown from memory, so nothing needs a public address.
* An HTML page inside a private repo displays, but the pictures and scripts it links to don't load.
* Without the token, the address shows "Repository not found" and the token box. It gives away the repo's name and nothing else.

## Examples

[examples/](examples/) holds one or two small files of every type TooToo shows (Markdown, code, CSV, images, SVG, audio, video, PDF, HTML), a blog folder, and folders five levels deep. Its [README](examples/README.md) is a short tour: what to try in each folder.

## In this repo

* [SPEC.md](SPEC.md): the specification.
* [BUILD-PROMPT.md](BUILD-PROMPT.md): the staged build prompt that built v1 ("build stage N"). History now.
* [AGENTS.md](AGENTS.md): the rules for agents, and the workshop commands.
* [INSTALL-LIST.md](INSTALL-LIST.md): Theo's installs and the release each runs.
* [0-tootoo-journal.md](0-tootoo-journal.md): the development journal.

## Open it

* **This repo, browsed by the latest build:** [index.html](index.html), live at [pushme-pullyou.github.io/tootoo](https://pushme-pullyou.github.io/tootoo/). Every `pwsh -File assemble.ps1` (and so every test run) refreshes it, keeping its own settings block.
* **Live on Pages:** the current source as the app at [/src/](https://pushme-pullyou.github.io/tootoo/src/), and the test suite at [/tests/](https://pushme-pullyou.github.io/tootoo/tests/).
* **The app from source:** double-click [src/index.html](src/index.html). On `file://` it offers to open a folder, or to browse GitHub. Add `?source=mock` to browse the test mock instead.
* **The release file:** `pwsh -File assemble.ps1` writes `build/index.html` (`-Release r2` stamps a release number).

## Test it

* `pwsh -File run-tests.ps1` builds, then runs the suite in headless Chrome twice: on `src/`, and inside `build/index.html`. Each run prints `PASS n / FAIL n`, followed by line counts against the 2,500-line budget. The CDN libraries need the network.
* Or open [tests/index.html](tests/index.html) (`?release=1` for the build) in Chrome.
* Before a release: [tests/live.html](tests/live.html) against the real GitHub API, and [tests/CHECKLIST.md](tests/CHECKLIST.md) by hand.

## Changelog

### 2026-11-23

* **r4 released.** Back to top in both panels; About and the GitHub token as pop-ups; a description and the build date in the page and in About; six new settings (`description`, `startFile`, `links`, `noindex`, `darkMode`, `bodyFont`); `view` and `sourceRepoUrl` retired; the header no longer shows the default name "TooToo".
* `examples/` added: sample files of every type, with credits.
* This README gains Settings, Private repos and Examples sections.
* The repo prepares to become `pushme-pullyou/tootoo` (SPEC decision 28, revised): `releases/` (r1–r3, `latest.json`) copied in byte for byte; README "Get TooToo" for strangers; AGENTS and SPEC updated.
* All 16 installs on r3; `.nojekyll` added to the public installs.

### 2026-11-22

* The header title follows the new SPEC §6 Header: icon → GitHub, owner → home page, repo → Pages site, app name → start. For r3.
* The file header has a GitHub mark linking to the open file on GitHub (SPEC §6 File header). For r3.
* The root `index.html` now runs the latest build: `assemble.ps1` refreshes it on every dev build, carrying its settings block over.
* A root `index.html`: r2, browsing this repo. INSTALL-LIST has it as the 17th install.
* v1 built in seven stages (0–6) from the build prompt: the scaffold and tests; config, state and router; the GitHub and local sources; shell, tree, content and the Browser view; the loaders; the update check and the swap; release mode and docs.
* The suite has 75 tests on `src/`, and the same tests plus 4 release checks inside the build. `live.html` has 5.
* Released as r2 in `pushme-pullyou-tootoo`, after the live page and the checklist passed.

### 2026-11-21

* Folder created. Spec skeleton drafted with the first eight decisions.
* Spec settled (32 decisions). Browser tests run for the folder picker and the `file://` fetch. Build prompt drafted.
