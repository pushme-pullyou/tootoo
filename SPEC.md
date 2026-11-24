# TooToo — Specification

**Status:** draft · **Created:** 2026-11-21 · **Owner:** Theo

This spec describes the rebuild of TooToo, the single-file GitHub repository viewer, and of the Dolittle workshop that builds and releases it. The build prompt for an AI agent will be derived from this document once it is settled.

---

## 1. Purpose & audiences

TooToo turns a repository into a readable website. It shows a file tree, renders Markdown and other file types, and runs as one HTML file with no server.

People it serves:

- **Theo's own installs:** about 16 repos and sites today (see `pushme-pullyou-dolittle/INSTALL-LIST.md`).
- **Anyone else:** a stranger should be able to:
  - download TooToo;
  - point it at their own repo by editing the config block;
  - publish it on GitHub Pages;
  - later see that a new release exists and update their copy.

  None of this should need an agent or Dolittle access.
- **Students reading the code:** each source file should be small and plain enough to follow.

What drives the rebuild:

- **Too many copies.** Today Dolittle pushes the same `index.html` into 16 repos and publishes each one. Installs still drift through hand-edits.
- **Code too big.** About 6,000 lines of source and a 3,700-line build.
- **Many app types.** A Hub, photo and sflprs galleries, notebooks, and file-type loaders loaded on demand.
- **Local files.** Browse folders on disk, not only GitHub repos.

## 2. Constraints

- Vanilla HTML, CSS and JavaScript (ES2020+). No frameworks, no package managers, no build tools beyond plain text assembly. No Node.js.
- Static hosting only: GitHub Pages, or opened directly via `file://`. No backend.
- The delivered app is **one self-contained `index.html`**, including its config.
- Functional style: `const`, arrow functions, template literals, async/await. No `var`, no classes, no `this`.
- Beginner-readable. CSS custom properties in `:root`. Dark mode supported.
- CDN dependencies are pinned to exact versions.

## 3. Decisions

| # | Decision | Why |
| --- | --- | --- |
| 1 | **Fresh start.** New code is written from this spec. Today's `src/`, `tootoo-reference.html` and the Dolittle journal serve as a feature inventory and a record of hard-won fixes, not as a code base. | The current code grew feature by feature; a rewrite from a clear spec is smaller and easier to read. |
| 2 | **Pull, not push.** Each install holds its own fully working `index.html`. Dolittle publishes numbered releases (`rN`) and never writes into installs. | The installer, whether Theo or a stranger, decides when to upgrade, and the 16-repo sync and publish goes away. |
| 3 | **Update check = notify only.** From time to time the install checks for a newer `rN` and shows "rN available" with a link. It does not rewrite itself. | A web page can't write its own file without extra permissions, and staying passive keeps the page safe and simple. |
| 4 | **Config inside `index.html`.** One clearly marked block holds all per-install settings. `tootoo.config.js` goes away. | One file is the whole install. The marked block can be moved mechanically during an update. |
| 5 | **One core + views + loaders, one release.** The core holds the tree, data sources (GitHub API, local folder), routing and config. A config setting picks the view (browser, Hub, gallery). Heavy file-type loaders are fetched only when needed. | One product and one update channel, with a small core. New app types become views, not new apps. |
| 6 | **Constraints unchanged:** see §2. | They are what make TooToo work anywhere with no install. |
| 7 | **The swap is doable by hand** by any installer: a few plain steps, possibly helped by a tool (§10). | Strangers must be able to update without Theo's agent. |
| 8 | **New sibling repo**, `pushme-pullyou-tootoo-next`. Today's Dolittle and installs stay on r1 until this replaces them. Releases still go to `pushme-pullyou/tootoo`, so the public URL and rN numbering continue. | The working system is not disturbed while the new one takes shape. |
| 9 | **v1 ships the Browser view only**, meaning today's tree + content viewer. Hub and Gallery are the first views after v1. | Smallest useful v1. Building Hub and Gallery on a working core tests the view contract for real. |
| 10 | **Local files via a folder picker with a fallback.** "Open folder" uses the File System Access picker (Chrome, Edge), and "Reopen last folder" reuses the stored folder at the cost of one permission click per visit. When the picker is missing (Firefox, Safari) or fails, it falls back to the folder-upload input (`<input type="file" webkitdirectory>`): same tree, no memory. It replaces today's "read files beside `index.html`" trick. Tested 2026-11-21 (§10). | One local mode that works for any folder in every browser, remembered where the browser allows it. |
| 11 | **v1 features = the §6 table.** | It replaces today's build for all 16 installs with a smaller core. |
| 12 | **The config block is a JS object.** It is `window.TOOTOO_CONFIG = { … }` in a `<script>` between marker comments, near the top of `index.html` (format in §4). | Same as today's `tootoo.config.js`, so each install migrates by pasting its file in. Comments are allowed and the syntax is forgiving. |
| 13 | **Built-in swap download.** The "rN available" notice has a **Download updated index.html** button. The page fetches rN, inserts its own config block, and offers the merged file. It still never writes files. | Anyone can update from a browser, with no agent and no hand-copying. |
| 14 | **A fresh release's block lists every key, commented.** Most keys are commented out, each with a short note, like today's `tootoo.config.js`. | The block documents itself for strangers. |
| 15 | **No config editor in v1.** The block is edited by hand. Revisit after v1. | Smaller v1. Decision 14 makes hand-editing easy. |
| 16 | **Releases are hosted in `pushme-pullyou/tootoo`**, with `releases/latest.json` on GitHub Pages as the marker (layout in §5). | Pages files allow cross-origin fetches and don't use the GitHub API's 60/hour quota. The swap download needs both. |
| 17 | **Check once a day.** The check runs on page load, at most once per 24 hours per browser. The last check is remembered in localStorage, and failures are silent. | Fresh enough, and quiet. |
| 18 | **Two config keys:** `checkForUpdates` (default `true`) and `updateUrl` (default: the `latest.json` above). | An installer can turn the check off. Someone who forks and builds their own TooToo can point installs at their own releases. |
| 19 | **The notice is shown only to likely maintainers:** when the page is opened via `file://`, or when a GitHub token is saved. Public readers of a Pages site never see it. | The message is meant for whoever maintains the install, not for its readers. |
| 20 | **Classic scripts, inlined for release.** `src/index.html` loads plain `<script src>` files in order: shared globals, one namespace object per file. The assembler only inlines those tags (and the stylesheet) into the release file. There is no dev/production split. | The source runs straight from `file://` in any browser, with no flag. The assembler stays trivial. |
| 21 | **State + events.** One `state` object with one writer per field (today's rule), plus a tiny `on` / `emit` that parts react to. | Views subscribe instead of being wired in by hand, which Hub and Gallery will need. |
| 22 | **Libraries:** marked and DOMPurify load at startup. highlight.js, PDF, CSV and the rest load the first time a file needs them. All are pinned CDN versions. | Nearly every page shows a README; everything else stays off the startup path. |
| 23 | **Size budget:** at most about 300 lines per source file, and about 2,500 lines for all of v1 (JS + CSS). Today it's about 6,000. | A student can read any file in one sitting, and the whole app in an afternoon. |
| 24 | **One test page + a mock source:** `tests/index.html` loads `src/` directly, uses a homemade `test` / `assert`, and runs against `tests/mock-source.js` (§9). | Offline, no API quota, no framework. One place to look. |
| 25 | **Agents verify with headless Chrome** (`--dump-dom`) and read the `PASS n / FAIL n` line. | The build prompt's stages can check themselves, with no installs. |
| 26 | **Live GitHub tests on a separate smoke page**, run by hand before a release. | Real-world coverage without spending quota on every run. |
| 27 | **Release gate:** the suite on `src/` and on the assembled file, the live smoke page, and a short manual checklist. | Some things only a person can check: the picker click, how it looks, phone width. |
| 28 | ~~**This repo becomes Dolittle.**~~ **Revised 2026-11-23: this repo becomes `pushme-pullyou/tootoo`**, TooToo's own workshop and release host; today's `tootoo` is renamed `tootoo-2026-11` and stays active. **Dolittle stays the family's core**: the Menagerie hub (TooToo, GubGub, DabDab, JipJip) with the shared rules and plans (§8). | TooToo keeps the name people know, and one repo holds its source and releases. Shared code moves into Dolittle when GubGub begins, not before: what's worth sharing shows up with the second animal, so no abstracting too soon. |
| 29 | **Workshop commands: `build`, `test`, `release`, `update <install>`.** `INSTALL-LIST.md` becomes Theo's checklist with a release column (§8). | Theo can update his own installs in one step, while every install still chooses its release. |
| 30 | **Migration: r2 is the first rebuild release. Pilot on `theo-armour-sandbox`**, then the other 15 in one batch (§7). | One low-stakes install proves the paste-as-is path first. |
| 31 | **Delete each install's `tootoo.config.js` in its migration commit.** | No stale second config to confuse anyone. Git keeps it, and rollback is a revert. |
| 32 | **On `file://`, offer the folder first.** A start panel shows **📂 Reopen \<folder\>** when this page has a remembered folder, or **📂 Open folder** otherwise, plus **Browse GitHub instead**. Nothing is fetched from GitHub until you choose. The folder and the local/GitHub choice are remembered **per page path**, and the panel opens on the remembered choice. | Opening a cloned repo from disk is usually about local files, including unpushed edits. One click (which Chrome requires anyway) replaces today's flag-dependent side-by-side read. |

## 4. Architecture

Settled 2026-11-21 (decisions 20–23).

### Source layout

```text
src/
  index.html            dev page = the app: holds the config block, loads the files below in order
  styles.css            tokens in :root, then one section per part
  core/
    config.js           built-in defaults, merged with window.TOOTOO_CONFIG
    state.js            the one state object + on / emit
    router.js           ?owner=&repo= and #path#heading
    update.js           daily check, "rN available", swap download (§5)
  sources/
    github.js           GitHub REST API: tree, files, token, rate limits, "too large"
    local.js            folder picker + upload-input fallback (decision 10); file:// start panel (decision 32)
  ui/
    shell.js            header, footer, theme, A−/A+, About
    tree.js             sidebar tree, filter, keyboard, resize / collapse
    content.js          file header (breadcrumbs, actions) + hands the file to a loader
  loaders/
    index.js            extension → loader table; loads libraries on demand
    markdown.js  code.js  media.js  text.js  pdf.js  csv.js  html.js
  views/
    browser.js          v1: shell + tree + content
tests/                  regression pages that open via file:// (§9)
assemble.ps1            inline <script src> / <link> → one release index.html
```

### Contracts

- **Source:** each source provides the same four async functions, so the tree and content code never know where files come from:
  - `listTree()` → `[ { path, type: 'file' | 'folder', size } ]`
  - `readText( path )`
  - `readBlob( path )`
  - `fileUrl( path )`: a URL for a new tab or an iframe (raw GitHub, Pages, or a blob URL).
- **Loader:** `{ extensions: [ … ], library?: [ pinned CDN URLs ], render( file, element ) }`. `loaders/index.js` picks the loader by extension, loads its libraries the first time (once per page), then calls `render`. Unknown types fall back to the text or download loader.
- **View:** `{ name, mount( element ), unmount() }`. `CONFIG.view` picks one at startup, `'browser'` by default. A view composes the `ui/` parts and subscribes to events. It never reaches into another view.
- **Events:** emitted by the part that owns the state change. Initial set:
  - `repo-changed`
  - `tree-loaded`
  - `file-selected`
  - `file-rendered`
  - `theme-changed`
  - `update-available`
  - `open-requested`: the router reports a hash change; `content.js` opens the file and owns `currentPath` (added in Stage 1)

### State ownership

The one-writer rule from today's `ARCHITECTURE.md` carries over. Each field of `state` has exactly one owner; everyone else reads it and listens for its event.

| Field | Owner |
| --- | --- |
| `owner`, `repo`, `branch` | `router.js` / `sources/*` |
| `source`, `tree` | the view, which picks the source and asks it for the tree; via `tree-loaded` (changed in Stage 3) |
| `currentPath` | `content.js` |
| `release`, `latest` | `update.js` |

### The assembler

`assemble.ps1` reads `src/index.html` and replaces each `<script src="…">` and `<link rel="stylesheet" href="…">` that points into `src/` with the file's contents inline. It stamps the `tootoo-release` meta and writes one `index.html`. CDN tags are left alone. Nothing else: no config swap, no templates.

Added 2026-11-23: it also stamps `<meta name="tootoo-built" content="YYYY-MM-DD">` with the build date, and writes a one-line banner comment under the doctype naming the release, the date and the source repo. The date has no time, so a rebuild on the same day gives the same file.

One addition (2026-11-22): a `dev` build also refreshes this repo's own root `index.html` with the new build, carrying the root's config block over unchanged (the same text swap as an update). So the workshop's front page always runs the latest build, and a broken build shows there first. Release builds (`-Release rN`) leave it alone.

### The config block (settled: decisions 12–14)

```html
<!-- TOOTOO-CONFIG-START: your settings. Updates carry this block forward unchanged. -->
<script>
window.TOOTOO_CONFIG = {
  owner: 'theo-armour',
  repo: 'pages',
  appName: 'Pages',
  // themeColor: '#3a8856',       // highlight color
  // hiddenFolders: [ 'Images' ], // folder names to hide, at any depth
  // …every other key, commented, with a short note
};
</script>
<!-- TOOTOO-CONFIG-END -->
```

- **Placement:** early in `<head>`, so it's easy to find by hand and runs before the app code.
- **Markers:** the two comment lines are exact, unique strings. The swap replaces everything between them, markers included, with the old file's copy. It treats the block as text and never runs or rewrites it.
- **Reading:** the app merges `window.TOOTOO_CONFIG` over its built-in defaults, as today. A missing key means use the default. A key the app doesn't know is ignored, so an older block works in a newer release.
- **Release stamp:** lives outside the block, e.g. `<meta name="tootoo-release" content="r2">`, so the swap always gets the new number.

## 5. Release & update model

**Settled:**

- Releases are numbered `r1`, `r2`, … The first was cut on 2026-11-21 from the old build, so the rebuild's first release continues from r2.
- Each release is one self-contained `index.html` with a default config block.
- **Release host** (decision 16), all in `pushme-pullyou/tootoo`, served at `https://pushme-pullyou.github.io/tootoo/`. Since 2026-11-23 (decision 28, revised) that repo is this workshop itself, so `releases/` sits beside `src/`; r1–r3 were copied over byte for byte from the old repo, now `tootoo-2026-11`:

  | Path | What |
  | --- | --- |
  | `releases/rN/index.html` | Each release, frozen and never changed once cut |
  | `releases/latest.json` | The marker installs read, e.g. `{ "release": "r2", "date": "2026-12-01", "url": "https://pushme-pullyou.github.io/tootoo/releases/r2/index.html", "notes": "https://github.com/pushme-pullyou/tootoo/releases/tag/r2" }` |
  | `index.html` (root) | The latest build (`dev`), refreshed by every `assemble.ps1`; also the live demo. Strangers download a release instead (the README says how) |
  | GitHub Release `rN` | The release notes page, with `index.html` attached |

- **The check** (decisions 17–19):
  - On page load, at most once a day per browser, if `checkForUpdates` is on and the visitor is a likely maintainer (opened via `file://`, or a GitHub token is saved).
  - It fetches `updateUrl` and compares the `release` number with the page's own `tootoo-release` stamp, numerically.
  - When a newer release exists it shows a quiet notice: "rN available", with a link to the notes and the download button.
  - Failures are silent.
  - The About panel always shows the installed release number.
- **The swap** (decision 13):
  1. In the notice, click **Download updated index.html**. The page fetches rN's `index.html`, swaps in its own config block between the markers, and offers the merged file for download.
  2. Rename the old `index.html` to `index.bak`.
  3. Put the downloaded file in place as `index.html`, then commit and publish as usual.
- **Doing it by hand** gives the same result, and is the fallback when the download can't run: download rN, then copy everything from `TOOTOO-CONFIG-START` to `TOOTOO-CONFIG-END` from the old file over the same block in the new one.
- `index.bak` is always hidden from the tree, whatever `hiddenFiles` says (settled 2026-11-22: a block that sets `hiddenFiles`, like the sandbox's, would otherwise replace a default and show it). Git keeps old versions too; the `.bak` is for people without git.

**Open** (see §10): whether a `file://` page can fetch the marker and rN's `index.html`. If it can't, a helper page on the release site does step 1 of the swap instead.

## 6. Feature inventory

Agreed 2026-11-21. Drawn from today's build (`pushme-pullyou-tootoo/README.md` features, `pushme-pullyou-dolittle/src/ARCHITECTURE.md` and the component READMEs). The journals there record the hard-won fixes worth keeping in mind.

| Area | Features | v1 |
| --- | --- | --- |
| **Shell** | One file; header; footer with rights text; dark mode; A−/A+ font size; favicon / brand icon; heading font; theme color | **Carry.** Branding comes from the config block |
| **Sources** | GitHub API: tree, files, token, rate-limit handling, "too large" notice. Auto-detect the repo from `.git/config`, the Pages URL or `?owner=&repo=`. File cache | **Carry.** The file cache gets simpler |
| **Local** | Folder picker (decision 10) | **New in v1.** Replaces today's "read files beside `index.html`" |
| **Tree** | Collapsible folders; cross-tree filter; keyboard navigation; hidden folders/files; dated backups hidden; README first + auto-open; blog-mode sorting; resize / collapse | **Carry** |
| | Hover counts and sizes | **Later** |
| **Content** | Markdown; highlighted code; images; audio / video; SVG; raw ↔ rendered toggle; copy / new tab / download; deep links `#file#heading` | **Carry** |
| **Heavy formats** | PDF, CSV, HTML preview | **v1, as loaders fetched on demand** |
| | Spreadsheets (SheetJS), notebooks | **Later**, as loaders |
| **Navigation** | ⌂ home link; plain owner / repo links | **Carry.** The header title is settled below (Header) |
| | Branch switcher; repo picker form; smart Pages-vs-GitHub links (`has_pages`) | **Later** |
| **Update** | "rN available" notice (§5) | **New in v1** |
| **Extras** | Self-test in About | **Drop from the app**; moves into the test pages (§9) |
| | Standalone component preview pages | **Drop** |
| | Config editor tool, header preview editor | **Drop for v1** (decision 15) |
| **Views** | Browser | **v1** |
| | Hub, Gallery | **Later**, the first views after v1 |

### Header

Settled 2026-11-22, after r2; it ships in the next release. The title part of the header, left to right:

1. **Icon:** the `faviconFile` image; when none is set, a small built-in GitHub mark. It links to the repo on GitHub: `https://github.com/<owner>/<repo>`.
2. **Owner:** the owner's GitHub login as-is (e.g. `pushme-pullyou`), linking to their home page: `https://<owner>.github.io`.
3. **Repo:** the repo name, linking to its Pages site: `https://<owner>.github.io/<repo>`. Always the Pages URL; checking whether a repo has Pages (`has_pages`) stays **Later**.
4. **App name:** `appName`, linking back to the start: this page with no file open. Left out when the install sets no `appName` of its own (the default "TooToo" is not shown), or when it only repeats the name before it, ignoring case, spaces and punctuation ("TooToo Next" after `tootoo-next`). It still names the tab and About.
5. **Subtitle:** `subtitle`.

Then the buttons, unchanged: ⌂ (when `homeUrl` is set), 🌓, A−, A+, ⚙️, ?.

- **The owner's own site repo** (`<owner>/<owner>.github.io`): the repo is left out; only the owner shows, linking to `https://<owner>.github.io`.
- **A local folder** that is a GitHub clone: owner / repo links as usual, with 📂 in front to show the files come from disk. Without a GitHub repo: 📂 and the folder name in place of owner / repo, with no links.
- **No repo known:** owner and repo are left out, and the icon links nowhere.

### Page head and About: build date and description

Settled 2026-11-23; ships in the next release.

- **Build date:** the `tootoo-built` stamp (§4, the assembler). About shows it after the release number: "TooToo release r4 · built 2026-11-23".
- **Description:** the page carries `<meta name="description">` with TooToo's own sentence. A new setting, `description`, lets an install describe its repo: at startup it replaces the tag's text. About shows whichever applies, under the subtitle. Search engines read the replaced text; link previews that don't run scripts see TooToo's sentence.
- **Banner:** a comment under the doctype, for whoever opens the file: the release, the build date, the source repo, and "edit only the settings block".

### File header: the file on GitHub

Settled 2026-11-22; ships in the next release. In the content panel's header, a small GitHub mark sits before the breadcrumbs, linking to the open file's source on GitHub: `https://github.com/<owner>/<repo>/blob/<branch>/<path>`, with `HEAD` (the default branch) when no branch is set. Same tab, like the other GitHub links.

- The breadcrumbs no longer start with the repo name: the mark already leads to the repo, and the header names it. They read `folder / … / file`, and a folder still links to its own README. The way back to the repo's README is the tree (or, online, the header's repo link).
- **↗ New tab** stays as it is: it opens the raw file; this opens the GitHub page (history, blame, edit).
- **A local clone:** the mark links to the pushed file, titled "on GitHub (may differ from your local copy)". **No GitHub repo:** no mark.

## 7. Migration of existing installs

Settled 2026-11-21 (decisions 30–31).

- **The first rebuild release is r2.** r1, the old build, stays frozen and runnable at `releases/r1/`.
- **Per install** (done with the `update` command, §8):
  1. Take r2's `index.html`.
  2. Paste the install's `tootoo.config.js` contents between the markers, as-is (decision 12). Keys r2 no longer uses, such as `faviconLetters` and `faviconColor`, are ignored. r2's release notes list the retired keys.
  3. Rename the old `index.html` to `index.bak`.
  4. Put the merged file in place as `index.html`.
  5. Check it via `file://`.
  6. Delete `tootoo.config.js` in the same commit (decision 31).
- **Order:**
  1. **Pilot: `theo-armour-sandbox`.** Its config has typical branding, two retired keys and a duplicated `subtitle`, so it tests the as-is paste.
  2. Live with it a few days.
  3. Migrate the other 15 in one batch.
- **The tootoo repo itself:** at the r2 release its root `index.html` becomes r2 with tootoo's own block (its theme, subtitle and fonts) swapped in, and its `tootoo.config.js` is deleted.
- **Rollback:** revert the install's migration commit. That brings back both the old `index.html` and `tootoo.config.js`. Renaming `index.bak` alone is not enough once the config file is gone.
- **Afterwards:**
  1. Archive the old workshop (decision 28).
  2. `PIPELINE.md`, `assemble.ps1 -Prod` and the sync step retire with it.

## 8. Workshop changes

Settled 2026-11-21 (decisions 28–29).

- **Home** (decision 28, revised 2026-11-23): this repo becomes `pushme-pullyou/tootoo`, TooToo's workshop and release host in one.
  1. Copy `releases/` from today's `tootoo` (done 2026-11-23).
  2. Rename today's `pushme-pullyou/tootoo` to `tootoo-2026-11`. It stays active, with a README banner pointing here.
  3. Rename this repo, `pushme-pullyou/tootoo-next`, to `tootoo`. Its Pages site then serves `/tootoo/releases/latest.json` again.

  **Dolittle** (`pushme-pullyou/dolittle`) stays the family's core: the Menagerie hub, the shared rules (vanilla, `file://`, the config block, pull-based releases, the workshop commands) and the roadmap. Its r1 pipeline (`promote` / `sync` / `publish`, `PIPELINE.md`) is retired. Shared code moves into it when GubGub begins.
- **Commands.** Typed in chat; Claude runs the whole step and reports back.

  | Command | Does | Writes git? |
  | --- | --- | --- |
  | `build` | `assemble.ps1` → `build/index.html` (gitignored) | No |
  | `test` | Headless suite on `src/` and with `?release=1` on the build (§9) | No |
  | `release` | Checks the release gate (§9). Then, in the tootoo repo: writes `releases/rN/index.html`, updates `releases/latest.json`, and makes the root `index.html` the new release with tootoo's own block. Commits and pushes, creates the GitHub Release `rN — YYYY-MM-DD` with `index.html` attached, and tags `rN` in this repo | Yes, after confirmation |
  | `update <install>` | For one of Theo's installs: takes the latest release, moves the install's config block into it (or pastes `tootoo.config.js` the first time), renames the old file to `index.bak`, and checks it via `file://`. Then shows the diff and commits and pushes after confirmation. Updates the install's row in `INSTALL-LIST.md` | Yes, after confirmation |

- **Rules carried over from today's `release`:**
  - confirm before every git write;
  - never force-push;
  - never move or delete an `rN` tag, GitHub Release or `releases/rN/` folder.
- **`INSTALL-LIST.md`** moves here as Theo's own checklist: local path, `owner/repo`, branch, and **release** (e.g. `r2`). It's only for Theo's convenience. Strangers never need it, and nothing pushes to the installs it lists.
- **Retired:** `promote`, `sync`, `publish`, the dev/production config swap, and `PIPELINE.md` (replaced by this section).

## 9. Testing & verification

Settled 2026-11-21 (decisions 24–27).

### Files

```text
tests/
  index.html        the suite: loads src/ scripts + test.js + mock-source.js; ?release=1 runs it against the assembled file
  test.js           homemade test( name, fn ) / assert helpers (~40 lines); prints "PASS n / FAIL n"
  mock-source.js    the four-function source over an in-memory tree with a sample of every file type
  live.html         smoke page against the real GitHub API (a handful of calls); run by hand
  CHECKLIST.md      the manual release checklist
```

### What the suite covers

- **Pure logic:**
  - config merge: defaults; unknown keys ignored.
  - router: parse and build `?owner=&repo=` and `#path#heading`.
  - tree: README first; blog mode; hidden folders and files; dated backups and `index.bak` hidden.
  - filter: hyphens and spaces count as the same.
  - release comparison: `r9` < `r10`.
  - choosing a loader by extension.
- **The config-block swap:** the block comes through byte-for-byte, with comments and unknown keys kept. A missing or doubled marker gives a clear error, never a silent bad file.
- **With the mock source:** the Browser view mounts; the tree renders; each loader puts the right element on the page (headings, highlighted code, `<img>`, `<video>`, a PDF frame, a CSV table, an HTML frame); deep links open the file and scroll to the heading; events fire in order.
- **Release file** (`?release=1`):
  - no `<script src>` or stylesheet link points into `src/`;
  - exactly one `tootoo-release` stamp;
  - exactly one `tootoo-built` stamp holding a date, the banner under the doctype, and one description;
  - each config marker appears exactly once;
  - the suite passes against the assembled file.

### How an agent runs it

Headless Chrome, with no installs (checked 2026-11-21 on Chrome 158; the output must go to a file):

```powershell
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
Start-Process $chrome -NoNewWindow -Wait -RedirectStandardOutput "$env:TEMP\tootoo-tests.html" -ArgumentList `
  "--headless=new", "--disable-gpu", "--user-data-dir=`"$env:TEMP\tootoo-headless`"", `
  "--allow-file-access-from-files", "--virtual-time-budget=10000", "--dump-dom", "file:///<repo>/tests/index.html"
Select-String -Path "$env:TEMP\tootoo-tests.html" -Pattern 'PASS \d+ / FAIL \d+'
```

Each build stage in the prompt ends with this check, and a stage is done only at `FAIL 0`.

### Release gate (before cutting rN)

1. The suite passes on `src/` and with `?release=1` on the assembled file.
2. `tests/live.html` passes against the real GitHub API.
3. `tests/CHECKLIST.md` has been worked through by hand:
   - folder picker, reopen last folder, and upload-input fallback;
   - the `file://` start panel: first visit, a return visit (Reopen), and "Browse GitHub instead";
   - the update notice and the merged download;
   - dark mode;
   - phone width;
   - one install opened via `file://` and one on Pages.

## 10. Open questions

- ~~**Cloned repo opened via `file://`**~~ — settled 2026-11-21 as decision 32. Notes for the build:
  - Folder access needs a click, so even "Reopen" is one click per visit.
  - `showDirectoryPicker` can't start at a path, so the first visit means navigating to the folder.
  - All `file://` pages share one IndexedDB, so stored handles are keyed by `location.pathname`.
- **Hub and Gallery:** define both before work on them starts (after v1).
- ~~**Fetch from `file://`**~~ — **confirmed 2026-11-21** (Chrome 157, page opened via `file://`):
  - `isSecureContext` is true.
  - Fetching `releases/r1/index.html` from GitHub Pages returns 200 with the full text.
  - A missing `latest.json` gives a readable 404.
  - A Blob download of the merged file works.

  Decision 13 stands.
- **Folder picker on `file://`** — tested 2026-11-21:

  | Test | Chrome 157 (Theo's) | Edge (Chromium 158) |
  | --- | --- | --- |
  | `showDirectoryPicker` via `file://` | ❌ AbortError at once, no dialog, on both `C:` and `G:`. Also fails on an `https` site, so `file://` is not the cause | ✅ read `G:\…\theo-armour-sandbox` (603 files, 157 folders) in 0.6 s |
  | `showOpenFilePicker` (one file) | ✅ | — |
  | `<input type="file" webkitdirectory>` | ✅ read a `G:` repo; Chrome asks "Upload N files?" | — |

  - The picker design works, and `G:` is fine. The failure was specific to Theo's Chrome install (cause below).
  - The folder-upload input works everywhere, Firefox and Safari included, but can't remember the folder between visits.
  - Remembering works: after closing and reopening the page, Edge reused the stored folder with one prompt (`queryPermission: prompt → granted`).
  - **Decided:** picker with the upload input as fallback (decision 10).
  - **Cause of the Chrome failure:** a bug in Chrome 157.0.8103.79. The profile had no blocking settings, no flags, and no interfering extensions. After updating to Chrome 158 the picker works. The fallback still covers anyone stuck on an affected version.
