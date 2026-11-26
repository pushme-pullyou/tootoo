# TooToo release checklist

The by-hand part of the release gate (SPEC.md §9). Work through it in your own Chrome, after:

1. `pwsh -File run-tests.ps1` prints two `FAIL 0` lines;
2. [live.html](live.html) ends with `FAIL 0`.

These are the things the headless runs can't check: a real click on the folder picker, IndexedDB on `file://`, how it looks, and a real install.

Start from a fresh build: `pwsh -File assemble.ps1` writes `build/index.html`.

## Local folders (`file://`)

Open [`build/index.html`](../build/index.html) by double-clicking it.

- [x] **First visit:** the start panel shows **📂 Open folder** and **Browse GitHub instead**. Nothing loads from GitHub yet.
- [x] **Open folder:** pick a cloned repo (e.g. `theo-armour-sandbox`). Its tree shows, `.git` doesn't, and the README opens. The header shows 📂 and the folder name.
- [x] An edited, not-yet-pushed file shows its new text.
- [x] **Reopen:** reload the page. The panel offers **📂 Reopen \<folder\>** first. One click and a permission prompt reopen it.
- [x] **Browse \<owner/repo\> on GitHub instead:** the panel names the folder's repo. It browses that repo on GitHub, and on the next visit that button comes first.
- [x] **Per page:** a second copy of the build in another folder remembers its own choice. It also has its own dark mode, text size and sidebar width, so it starts with the defaults (by design, as in r1).
- [X] **Upload fallback:** the backup way to open a folder, for browsers without the folder picker (Firefox, Safari) or when it fails. Nothing leaves your computer, but the folder isn't remembered: no Reopen next time. To test it in Chrome:
  1. Click **📂 Open folder**, then **Cancel** in the folder dialog.
  2. The panel says "No folder opened…" and shows **📤 Choose folder (upload)**. Click it.
  3. Pick the folder and accept Chrome's "Upload N files to this site?" prompt.
  4. The tree and README load, as with the picker.

## GitHub

Open `build/index.html?owner=theo-armour&repo=pages`, choose Browse GitHub, and check:

- [x] Tree, README, a deep link (`#path#heading`) and the back button.
- [x] **⚙️ Token:** save a token, and the page reloads using it. **Remove** it again.
- [x] A private repo without a token opens the token panel with a clear reason.

## Files

- [x] Markdown: headings, tables, images, relative links, and a link to a heading.
- [x] Code is highlighted; **Raw** ↔ **Rendered** on Markdown, HTML, CSV and SVG is remembered per type.
- [x] An image, a video that plays, a PDF in the browser's viewer, and a CSV table.
- [x] A video inside Markdown plays: [examples/video/video-in-markdown.md](../examples/video/video-in-markdown.md).
- [x] An HTML page runs in its frame. A TooToo `index.html` shows the "not previewed" note instead.
- [x] **Copy**, **New tab** and **Download** each work once.

## Look and feel

- [x] **Dark mode** (🌓): text, code colors, tables and panels are all readable. It's remembered after a reload.
- [x] **A− / A+** change the text size, remembered after a reload.
- [x] Drag the divider, and collapse with ☰ or **Ctrl+B**: both are remembered.
- [x] Keys: `/` filter, `\` tree, arrows, Home / End, Enter / Space.
- [x] **Phone width** (DevTools device mode, 390 px): the sidebar starts closed and slides over the content, and the buttons wrap.

## Added in r4

Open the live workshop page, or the build pointed at this repo, and use [examples/](../examples/README.md) for the files.

- [ ] **Back to top:** scroll a long file (`examples/docs/markdown-help.md`): a ↑ appears at the bottom right and returns to the top. The same in the file list, when it is long enough to scroll.
- [ ] **Pop-ups:** scroll down, then press **?** and **⚙️**: each opens centred over a dimmed page. Escape, the ✕ and a click outside all close it.
- [ ] **About** shows a description and "built YYYY-MM-DD" after the release number, and "source and updates" goes to the TooToo repo.
- [ ] **The header** shows no "TooToo" on an install that sets no `appName`.
- [ ] **Settings:** in a copy of the build, set `startFile`, `links`, `darkMode: 'dark'` and `bodyFont`. It opens that file, starts dark, shows the links at the right of the footer and in About, and uses the font.
- [ ] Dark mode and phone width again, with a pop-up open and the footer links showing.

## The update notice and the swap

The notice needs a numbered release and a newer one to point at. To fake that:

1. `pwsh -File assemble.ps1 -Release r1`, then copy `build/index.html` into a scratch folder as `install/index.html`.
2. `pwsh -File assemble.ps1 -Release r2`, then copy it to `releases/r2/index.html` in the same scratch folder.
3. Next to them, write a `latest.json`: `{ "release": "r2", "url": "file:///…/releases/r2/index.html", "notes": "https://example.com" }`.
4. In `install/index.html`'s config block, set a theme color, a subtitle with a non-ASCII character, and `updateUrl: 'file:///…/latest.json'`.

- [x] Opened via `file://`, the install shows **TooToo r2 available**.
- [x] **⬇ Download updated index.html** saves an `index.html` stamped r2, with the install's block byte for byte (compare the two files).
- [x] The notice shows again the same day without a new request, and not at all on an `https://` page without a token.
- [x] Run `pwsh -File assemble.ps1` afterwards, to put `build/` back to `dev`.

## Real installs

- [ ] **One install via `file://`:** copy the settings block from a real install (e.g. `theo-armour-sandbox/index.html`) into a copy of the build, open it, and check its branding (theme color, heading font, subtitle). If the block holds a retired setting (`view`, `sourceRepoUrl`), About lists it as ignored.
- [x] **One install on Pages:** the same copy served from a Pages site (or the pilot, Stage 7) browses its repo with no URL parameters, and its HTML files open as the published pages. (2026-11-23: the sandbox on r3 browses its 509 files, and `sample-page.html` opens at its published URL; 14 installs serve r3.)
