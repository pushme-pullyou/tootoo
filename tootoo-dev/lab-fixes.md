# TooToo Lab — Fixes Log

Places where the component build diverged from canonical `index.html` — mostly
regressions from simplifications made during the carve — and how each was fixed.
Each entry is a concrete diff point: **useful raw material for the graduation diff.**

Tag key: 🔁 regression vs canonical · ✨ new/better than canonical · 🐞 lab-only bug.

---

## 2026-06-21 — found by *using* the assembled build

### 🔁 Header title stuck on "TooToo Lab"
- **Symptom:** the header title never changed to the loaded repo.
- **Cause:** `header.js` set the label to `CONFIG.appName`; the carve dropped the
  `owner / repo` logic canonical has via `APP_ORIGIN` (§8), and it wasn't refreshed
  after detection.
- **Fix:** label = `state.owner / state.repo`, else `appName`; `main.js` calls
  `updateHeaderFromConfig()` after `detectRepo()`.

### 🔁 Rate badge always visible (+ fake "4983 / 5000" seed)
- **Symptom:** the API count showed constantly, and a fake count flashed on load.
- **Cause:** `updateRateBadge` always set `display:inline-block`. Canonical only
  surfaces it when remaining ≤30 (low) / ≤10 (critical) (§14); the live count lives
  in the ⚙️ tooltip otherwise.
- **Fix:** show only when ≤30, toggle `.low`/`.critical`; added those CSS states;
  removed the fake seed from `header.js`.

### 🔁 Sidebar footer dropped to the bottom of the page; tree scroll-to-top dead
- **Symptom:** the sidebar footer sat below the entire tree; clicking it did nothing.
- **Cause:** `body { min-height: 100vh }` instead of canonical `height: 100vh` — the
  shell grew and the whole page scrolled as one, so `#treeList` never became its own
  scroll container.
- **Fix:** `body { height: 100vh }` — locks the shell; sidebar + content scroll
  internally; the footer pins and scroll-to-top has something to scroll.

### 🐞 Content back-to-top button never appeared / did nothing
- **Symptom:** no floating ↑ in the content area.
- **Cause:** its scroll/click wiring was stranded in `content.html`'s lab harness
  (outside the `@part` markers), so the assembler skipped it.
- **Fix:** moved the wiring into `content.js` `initContent()`.

---

## 2026-06-21 — found while verifying drop-in (`file://`)

### 🐞 Drop-in loaded the default repo, not the dropped-into one
- **Cause:** `detectLocalMode` used `CONFIG.owner || m[1]`, so the `config.js`
  default won over `.git/config`; the remote regex also choked on dotted repo names
  and `git@` ssh URLs.
- **Fix:** `.git/config` now overrides the CONFIG default; widened the regex (dots,
  ssh, trailing slash); added a "Choose a repository" fallback for a git repo with
  no GitHub remote. (An earlier "failure" was a non-GitHub folder — expected.)

---

## 2026-06-21 — found in code review

### 🐞 Deep-linked file in a collapsed folder was highlighted invisibly
- **Cause:** `selectFile` didn't open ancestor `<details>` or scroll the row in view.
- **Fix:** walk ancestors `open = true` + `scrollIntoView` (`content.js`).

### ✨ `\` now exits the filter into the tree (`/` ⇄ `\` toggle)
- Canonical ignores `\` inside inputs (it types a backslash). The lab lets `\` fire
  from the filter box so `/` and `\` toggle between filter and tree. *Better than
  canonical — port back at graduation.*

---

## 2026-06-21 — persistence/nav layer (from the final canonical review)

The carve wired controls per-component but skipped the save/restore canonical
centralizes in `initAppearance`/`setupListeners`. Closed the six 🔁 regressions:

- 🔁 **Font size** now persists (`fontSize`) + restores; step ±2, range 10–36 (max raised
  from canonical's 28). ✨ A−/A+ tooltips show the current size (e.g. "currently 22px").
- 🔁 **Sidebar width** persists on resize (`sidebarWidth`) + restores (+ narrow default).
- 🔁 **Dark mode** — 🌙↔☀️ icon swap, OS-preference default, `'true'/'false'` storage.
- 🔁 **Last-opened file** remembered per repo (sessionStorage); init priority hash → last → README.
- 🔁 **`hashchange`** wired; `updateHash` assigns `location.hash` (history entries) so
  back/forward + address-bar edits work.
- 🔁 **Header-title click** resets to the home repo (clears hash/query/repo-cache/last-file).

Also added: `updateSidebarToggle` (Open/Close tooltip + aria) shared by the button,
keyboard, and restore.

## 2026-06-21 — layout change: branch picker moved to the header

✨ Deliberate divergence from canonical. The branch chip (`⎇ <branch> ▾`) moved from
the sidebar "Files" header up to the app header, right after the `owner / repo` title
— so the header reads as the full address `owner / repo  ⎇ branch`. Aligns markup
with ARCHITECTURE.md (header owns repo + branch) and Theo's old agenda item.
- Markup: `#btnBranch` + `#branchMenu` (wrapped in `.branch-control`, `position:relative`)
  moved `sidebar.html` → `header.html`; sidebar "Files" header is now summary + ⊞ only.
- CSS: added `.branch-control { position: relative }` to anchor the dropdown.
- Outside-click-to-close selector updated `#filesPanelHeader` → `.branch-control`.
- The **☰ sidebar toggle intentionally STAYS in the header** — it must remain
  reachable to reopen a collapsed sidebar.
- Tidy-up TODO: the branch JS (toggle/switch/fetch-list) still lives in `sidebar.js`
  (it depends on `fetchTree`/`autoSelectReadme`); works by id, but belongs in
  `header.js` ownership-wise. Move during graduation.

## 2026-06-23 — config-parity review: dark-mode highlight bug + knob completeness

Audited every CONFIG knob against canonical and confirmed each is honored in the lab
(owner/repo/branch, storagePrefix, appName, sourceRepoUrl, hidden files/folders,
maxRepoFiles, themeColor, subtitle, favicon*, headingFont*). One real bug:
- 🐞 **Dark mode ignored its brighter highlight in the default config.** The lab
  defaulted `themeColor: '#2563eb'` (truthy), so `initAppearance` set `--highlight-color`
  **inline on `document.body`** — and inline beats the `body.dark-mode { --highlight-color:
  #3b82f6 }` rule, so dark mode kept the darker `#2563eb`. Canonical defaults `themeColor:
  ''` (falsy → no inline → the CSS override wins). Changed the lab default to `''`.
  Verified: default build sets no inline highlight (dark mode → `#3b82f6`); a fork's
  explicit color (theo-armour-pages `#e67e22`) is still set inline on `body`, so it
  persists in both light and dark mode.
- Tidy: declared `headingFontUrl` / `headingFont` in the CONFIG defaults block (they
  worked via `undefined` but weren't documented).
- Noted, not changed: the lab mutates CONFIG directly and has no `CONFIG_DEFAULTS`
  snapshot (canonical keeps one for repo-reset fallback); the lab resets via reload, so
  it's a design divergence, not a bug.

## 2026-06-23 — restore per-repo tootoo.config.js (window.TOOTOO_CONFIG)

🔁 Big carve regression. Canonical loads an optional `tootoo.config.js` next to
`index.html` (`<script src="tootoo.config.js" onerror="void 0">`) that sets
`window.TOOTOO_CONFIG`, then `Object.assign`s it over CONFIG — the fork branding model
(theme/favicon/appName/subtitle/hidden files, all without editing index.html). The lab
build dropped this entirely, so a dropped-in repo's `tootoo.config.js` was ignored and
theme/favicon/footer marks never changed.
- `index.template.html`: added the `<script src="tootoo.config.js" onerror="void 0">`
  in `<head>` (loads over file:// without the file-access flag).
- `main.js` `initApp`: merges `window.TOOTOO_CONFIG` over CONFIG first thing, so the
  per-repo file wins over the baked `config.js` defaults. Everything downstream
  (`applyFavicon`, `renderFooter`, theme var, hidden-file sets) then sees it.
- Refined the file-access guard: it now stands down when a repo is explicitly chosen
  via `?owner=` **or** `tootoo.config.js` (browse over GitHub; https needs no flag),
  instead of showing the "can't read local files" help.
Verified on theo-armour-pages (its tootoo.config.js): title `theo-armour / pages`,
`--highlight-color #e67e22`, favicon/footer/sidebar marks = orange “PG”, subtitle and
`hiddenFiles` applied.
- ✅ Follow-up: `headingFont` / `headingFontUrl` now ported too. The CSS consumer
  (`h1–h6, #headerTitle { font-family: var(--heading-font, var(--font-family)) }`) was
  already in `styles.css`; only the JS was missing. Added `applyHeadingFont()` in
  `core.js` (injects the stylesheet `<link>`, sets `--heading-font`) and called it from
  `initApp`. Verified on theo-armour-pages: Patua One stylesheet injected +
  `--heading-font: "Patua One", serif` on `<html>`.

## 2026-06-23 — review of the recent batch (footer / favicon / date / drop-in guard)

Audited the four recent changes. The footer-into-content-pane + flex-column change is
clean: `.iframe-content` is a fixed `70vh` (not `100%`) so media doesn't collapse, and
print resets `.content-area` to `display:block` while hiding `.app-footer`. `footer.js`
already handles an empty owner. Two issues found and fixed:
- 🐞 **`?owner=…` ignored when file access is blocked.** The `fileAccessBlocked` guard
  ran before `detectRepo`, so a `file://` URL with `?owner=…&repo=…` (https, needs no
  flag) hit the help screen instead of loading — even though the help text suggests
  that very param. Guard now stands down when `?owner=` is present. Verified headless
  (no flag + params → `octocat / Hello-World`, not the help screen).
- 🔁 **Header date tooltip reverted to the build date on cached repos.** `state.repoUpdated`
  is set in `getDefaultBranch`, skipped on a cache hit → 2nd visit fell back to
  `meta[revised]`. Now `cacheRepo` stores `updated` and the cache-restore path rehydrates
  `state.repoUpdated` (may be slightly stale until the cache is cleared via title-click).

## 2026-06-22 — drop-in: don't silently browse the default repo when file reads are blocked

🐞 Root cause of "dropped into repo X but shows pushme-pullyou/tootoo": `detectLocalMode`
needs `fetch('.git/config')`, which over `file://` requires Chrome's
`--allow-file-access-from-files`. If the flag isn't active (classic cause: Chrome was
already running, so a flagged relaunch is ignored), the fetch throws, detection is
skipped, and the app silently falls back to the baked `CONFIG` default (tootoo) — looks
like a bug. Proven with headless: same file → `theo-armour/pages` *with* the flag,
`pushme-pullyou/tootoo` *without*.
- `detectLocalMode` now **probes** a file that must exist (the page itself) when
  `.git/config` is unreadable. If that read is *also* blocked → `fileAccessBlocked = true`
  (flag missing); if it succeeds → genuinely no `.git` here (unchanged fallback).
- `main.js` shows a clear "Can't read local files" help screen (quit Chrome fully →
  relaunch with the flag → verify at `chrome://version`) instead of loading the wrong
  repo. The configured default is NOT silently browsed.
Verified headless both ways: flag → real repo; no flag → help screen, no tootoo load.

## 2026-06-22 — header tooltip shows the VIEWED repo's date, not the build date

🐞 Drop-in regression. The header-title tooltip ("Last updated: …") read the static
`meta[revised]` baked into `index.html`, so a copy dropped into another repo kept
showing the tootoo-lab build date instead of adapting. Fixed to use the repo's real
last-push date:
- `getDefaultBranch` already fetches `/repos/{owner}/{repo}`; now also stores
  `data.pushed_at` → `state.repoUpdated` (new state field).
- `header.js` `setHeaderTimestamp()` prefers `state.repoUpdated` (`toLocaleString`),
  falling back to `meta[revised]` before the repo loads / if the API fails.
- Called from `updateHeaderFromConfig` (initial) and `fetchTree` (after the metadata
  fetch resolves the date).
Verified live: tooltip now reads the GitHub `pushed_at` time, not the build stamp.
(About-panel "Updated:" still shows `meta[revised]` — that legitimately documents the
app build, not the viewed repo.)

## 2026-06-22 — app footer scrolls with the content (no longer pinned)

✨ Per Theo: the page footer should flow with the content, not stay pinned to the
viewport. Moved the `<footer>` from a `<main>` sibling **into the content pane** so it
sits at the end of the content scroll:
- `content.html` now `@include`s `components/footer.html` inside `.content-area`
  (after the back-to-top button); removed the footer include from the template.
- `assemble.ps1` now **loops** the component-include pass (cap 8) so a fragment can
  embed another component — content → footer here.
- CSS: `.content-area` → `flex` column; `#contentBody` → `flex: 1 0 auto` so on short
  files the footer drops to the pane bottom instead of floating mid-pane (sticky-footer
  pattern), and on long files it sits below the fold (scroll to reveal).
- Header, sidebar, and the **sidebar's own footer stay pinned** (the `height: 100vh`
  shell is unchanged) — only the app footer scrolls. Footer is now content-pane width.

## 2026-06-21 — favicon + brand marks from CONFIG

🔁 The lab hardcoded the "TT" blue mark in the template `<link rel="icon">`, the footer
mark, and the sidebar footer badge. Added `faviconDataUrl()` + `applyFavicon()`
(reference §11) building the SVG from `CONFIG.faviconLetters` / `faviconColor`; all
three now use it (`applyFavicon` in `main`, marks via `faviconDataUrl()`). Exposed in
`config.js`. Verified config-driven (HX/green test → marks turned green "Hx").

## 2026-06-21 — footer: copyright + MIT license

✨ New page-level footer (canonical has none). Final design after iterating:
- **Left:** TT mark + **`© <year> <repo owner> · No rights reserved.`**
  (`updateFooterCopyright`, from `state.owner` + `new Date().getFullYear()`).
- **Right:** **MIT License** link → the repo's own root LICENSE file, opened in-app via
  the hash (`updateFooterLicense` finds `LICENSE`/`COPYING`* in `state.tree`, called
  after `fetchTree`); falls back to opensource.org if the repo has none.
- CSS: `.app-footer` → space-between with `.app-footer-brand` / `.app-footer-status`.
- (Briefly tried a data-source/API-quota status bar implementing the roadmap's
  "local-mode/rate-limit status", then dropped it as redundant — the header badge
  still flags the quota when low.)

## 2026-06-21 — sidebar header: new title + tooltip

✨/🔁 The header line changed from the icon stats `📁 N · 📄 M · size` to a cleaner
**`M files · size`** (Theo's pick). The folder count + a spelled-out summary moved to
the `#hFiles` `title` tooltip (`"N folders, M files, X total"`) — the lab previously
set the text but not the title (canonical sets both). Useful since the line
ellipsis-truncates on a narrow sidebar.

## 2026-06-21 — uniform header/file button sizes

🔁 (canonical has the same emoji-vs-text unevenness.) Emoji buttons (🌙 ⚙️ ☰ 📋 🖨 ↗)
rendered slightly taller/wider than text ones (A− A+ ? </>). Added a uniform-box rule
for `.header-btn`/`.file-btn`: fixed `height: 1.7rem`, `min-width: 1.7rem`, inline-flex
centered, `line-height: 1`. (Also matched the later `.file-btn` padding so it doesn't
override.) NOTE: the branch chip (`.branch-switcher`) keeps its own chip style — can
match its height to the buttons if wanted.

## 2026-06-21 — richer sidebar tooltips + dropped the size column

✨ Deliberate divergence. Tooltips now carry info the row doesn't:
- **Files:** `path` (line 1) + `Friendly Type · size` (line 2) — added
  `getFileTypeLabel` (ext → name) in `core.js`; native `title` honors the `\n`.
- **Folders:** "what's inside" — recursive `N files · M folders · total size` via a
  new `folderStats(node)` in `sidebar.js`.
- **Removed the right-side file-size column** (`.tree-item-size` span no longer
  rendered) since the size now lives in the file tooltip. (`.tree-item-size` CSS left
  in place but unused.)

## 2026-06-21 — GitHub icons scale with font size

🔁 (canonical has the same fixed-px issue.) The octocat SVGs (`#headerGitHub`,
`.file-title > a`) had fixed `width/height` attributes, so A−/A+ didn't resize them.
Added CSS `width/height` in `rem` (1.15 / 1.1) so they scale with the font size.

## 2026-06-21 — ☰ button flush-left with the sidebar

✨ Deliberate divergence. Header left padding `1rem → 0.5rem` so the ☰ (and the rest
of the header content) starts at the same left edge as the sidebar's filter/tree
column — a clean vertical line down the left. (Canonical uses 1rem.)

## 2026-06-21 — tree rows flush-left with the filter input

✨ Deliberate divergence. Dropped the tree rows' left padding (`.tree-folder` /
`.tree-item` `padding-left: 0.4rem → 0`) so top-level icons/names sit flush with the
filter input's left edge (the tree list already shares the input's 0.5rem inset).
Nested folders still indent from that baseline. (Canonical keeps the 0.4rem inset.)

## Pattern noted
Two fixes (sidebar footer icon, content back-to-top) share one trap: **real component
wiring placed in a standalone page's lab harness instead of the component's JS**, so
it didn't assemble. Both moved into the component JS; a sweep confirmed no other
functional wiring is stranded.
