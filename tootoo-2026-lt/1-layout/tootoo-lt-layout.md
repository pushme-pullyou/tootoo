# TooToo LT Layout — HTML/CSS Shell Prompt

Ignore the copilot-instructions.md rule about reading nearby code.

## Output File

Create `tootoo-lt-layout.html` — a single self-contained HTML file.

## Before Creating the File

If `tootoo-lt-layout.html.bak` already exists in the output directory, delete it. If `tootoo-lt-layout.html` already exists in the output directory, rename it to `tootoo-lt-layout.html.bak` before creating the new file.

## Hard Constraints

- **Single file**: One `.html` file — HTML, CSS, JS inline
- **Vanilla JS only**: No frameworks, no jQuery, no build tools, no Node.js
- **ES2020+**: `const`/`let` (no `var`), arrow functions, template literals
- **Functional style**: No classes, no `this` keyword
- **Every button must have a `title` attribute** with a descriptive tooltip
- **Beginner-readable**: If a student can't follow it, simplify

---

## What to Build

A three-panel layout (header bar + sidebar + content area) that fills the viewport. This is the static shell — no file tree rendering and no file content loading. It includes the CONFIG object, repo auto-detection, and header controls so the layout file is testable on its own.


### HTML Head

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="revised" content="YYYY-MM-DD HH:MM">
<title>TooToo LT</title>
```

Set the `revised` content to the current date/time when generating the file. Update this value every time the prompt is executed — it always reflects when the file was built.

The sidebar `.panel-header` title tooltip (`"Last updated: YYYY-MM-DD HH:MM"`) must match this same date/time value.

The `<title>` is updated dynamically by `updateHeaderFromConfig()` after repo detection.

---

## Layout Structure

```text
<body>  (flex column, 100vh, no overflow)

  <header>  (flex row, wraps, top bar)
    [GitHub SVG icon]  — <a> tag, id="headerGitHub", href="#" (updated dynamically), 18×18, currentColor,
                         display flex, align-items center, use this SVG path:
                         <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z">
                         title="View on GitHub"
    [Title text]       — <a> tag, id="headerTitle", href="#", bold, 1.1rem, initial text "TooToo LT"
                         (updated dynamically to "owner / repo"), clickable (reloads page via JS click handler
                         that calls e.preventDefault() then location.reload()), cursor pointer,
                         text-decoration none, color inherit, title="Reload"
    [Dark mode button] — id="btnDarkMode", class="header-btn dark-mode-btn", right-aligned (margin-left: auto), toggles 🌙/☀️, title="Toggle Dark Mode"
    [A− button]        — id="btnFontDec", class="header-btn", title="Decrease Font Size"
    [A+ button]        — id="btnFontInc", class="header-btn", title="Increase Font Size"
    [Help button]      — id="btnHelp", class="header-btn", text "?", title="About this app"
    [Token button]     — id="btnToken", class="header-btn", text "⚙️ Token", title="Set GitHub Personal Access Token"
    [Rate limit badge] — <div> id="rateBadge", class="rate-limit-badge", hidden by default (display: none),
                         shows "API remaining/limit", title="API Rate Limit", aria-live="polite"
  </header>

  <main>  (flex row, fills remaining height)

    <div class="sidebar">  (flex column, fixed width via --sidebar-width)
      <div class="panel-header" title="Last updated: YYYY-MM-DD HH:MM" (same value as meta[name=revised])>
        <h3 id="hFiles">Files</h3>
        <button id="btnExpandAll" class="secondary" style="display: none;" title="Expand All Folders">Expand All</button>
      </div>
      <input type="text" id="treeFilter" placeholder="Filter files…" title="Filter files by name">
      [Clear filter button] — `<button id="btnFilterClear">` inside a `<div class="filter-wrap">` wrapping the input, absolutely positioned at the right edge of the input, hidden by default (`display: none`), shows ✕, title="Clear filter"
      <div id="treeList">  — scrollable area, flex: 1, overflow-y: auto
        (empty — placeholder for future tree content)
      </div>
    </div>

    <div class="resizer" id="resizer" title="Drag to Resize Sidebar">  (8px wide, draggable column separator)
    </div>

    <div class="content-area" id="contentArea">  (flex: 1, scrollable, position relative)
      <div class="panel-header file-header">  (shared header class + sticky positioning)
        <h3 id="contentTitle">Content</h3>
      </div>
      <div id="contentBody">
        <p>Awaiting repository detection...</p>
      </div>

      <footer class="content-footer">
        <p>© pushme-pullyou authors · MIT License</p>
          — links: "pushme-pullyou" → https://github.com/pushme-pullyou/tootoo (target _blank, rel noopener)
                   "MIT License" → https://github.com/pushme-pullyou/tootoo/blob/main/LICENSE (target _blank, rel noopener)
      </footer>

      <button id="btnBackToTop" class="back-to-top" aria-label="Back to top" title="Back to Top">↑</button>
        — position fixed, bottom 1.5rem, right 1.5rem, z-index 20, --highlight-color background,
        white text, border-radius 50% (circular), width 2.5rem, height 2.5rem, font-size 1.2rem,
        display none initially, box-shadow 0 2px 6px rgba(0,0,0,0.25),
        also: align-items center, justify-content center
    </div>

  </main>
</body>
```

**Note**: The back-to-top button is *inside* `.content-area`, not a sibling of it.

---

## CSS Requirements

### Theming via Custom Properties

Define on `:root`:
- `--primary-bg`: `#f3f4f6`
- `--secondary-bg`: `#ffffff`
- `--text-color`: `#1f2937`
- `--border-color`: `#d1d5db`
- `--highlight-color`: `#2563eb`
- `--hover-bg`: `#e5e7eb`
- `--font-family`: `system-ui, -apple-system, sans-serif`
- `--sidebar-width`: `300px`
- `--font-size`: `16px`

### Dark Mode

`body.dark-mode` overrides:
- `--primary-bg`: `#1f2937`
- `--secondary-bg`: `#111827`
- `--text-color`: `#f3f4f6`
- `--border-color`: `#374151`
- `--highlight-color`: `#3b82f6`
- `--hover-bg`: `#374151`

Toggle button switches between 🌙 and ☀️. Persist choice to `localStorage`.

### Font Size on `<html>`

```css
html {
  font-size: var(--font-size);
}
```

The `--font-size` variable is set on `:root` and overridden via `document.documentElement.style.setProperty('--font-size', ...)` in JS. This makes all `rem` units scale proportionally.

### Layout Rules

- `body`: flex column, 100vh, margin 0, overflow-x hidden, font-family `var(--font-family)`, color `var(--text-color)`, background-color `var(--primary-bg)`
- `header`: flex row, wraps, align-items center, gap 0.5rem, padding `0.5rem 1rem`, background `--primary-bg`, border-bottom 1px solid `--border-color`, box-shadow `0 1px 2px rgba(0,0,0,0.05)`, z-index 10
- `main`: flex row, flex: 1, overflow hidden
- `.sidebar`: width `var(--sidebar-width)`, flex-shrink 0, flex column, background `--primary-bg`, padding `0`, overflow hidden
- `.resizer`: 8px wide, `--highlight-color` background at 0.7 opacity, cursor col-resize, touch-action none, transition opacity 0.2s; full opacity on hover (`.resizer:hover`) and while dragging (`.resizer.dragging`)
- `.content-area`: flex 1, min-width 0, padding `0`, overflow-y auto, background `--secondary-bg`, position relative
- `#contentBody`: padding `0 1rem 1rem 1rem`, background `var(--secondary-bg)`

### Color Scheme Summary

- **`--primary-bg`** (gray): header, sidebar, both panel headers
- **`--secondary-bg`** (white): content body, header utility buttons, filter input background
- Header utility buttons use `--secondary-bg` background to stand out from the gray header

### Panel Headers

Both sidebar and content area use a shared `.panel-header` class:
- display flex, justify-content space-between, align-items center
- padding `0.5rem 0.5rem`, border-bottom 1px solid `--border-color`
- background `--primary-bg` (gray, matching header and sidebar)
- Full width within their parent container (no side padding on parent)
- h3 inside: margin 0, font-size 0.95rem

The content area header adds `.file-header` for sticky behavior:
- position sticky, top 0, z-index 5, padding `0.5rem 1rem`, background `--primary-bg`

### Sidebar Internal Padding

- Filter input: wrapped in `<div class="filter-wrap">` (position relative, margin `0.4rem 0.5rem 0 0.5rem`); input margin 0, width 100%, box-sizing border-box, padding `0.3rem 1.6rem 0.3rem 0.5rem` (right padding leaves room for the ✕ button), font-size 0.85rem, 1px `--border-color` border, border-radius 4px, `--secondary-bg` background, `--text-color` color, outline none; on focus: border-color `--highlight-color`
- `#btnFilterClear`: position absolute, right `0.3rem`, top 50%, transform `translateY(-50%)`, background none, border none, cursor pointer, `--text-color` color, opacity 0.5 (1 on hover), font-size 0.9rem, display none by default
- `#treeList`: padding `0 0.5rem`, flex 1, overflow-y auto

### Buttons

Two button styles via CSS classes:

1. **`.header-btn`** (header utility buttons — dark mode, font size, token):
   - `--secondary-bg` background, `--text-color` color, 1px `--border-color` border
   - padding 0.4rem 0.75rem, border-radius 6px, cursor pointer, **`font-size: 1rem`** (scales with `--font-size` on `html`)
   - transition: opacity 0.2s, transform 0.1s
   - Hover: opacity 0.88, translateY(-1px)
   - Active: translateY(0)

2. **`button.primary`, `button.secondary`** (action buttons like Expand All, Set Repository):
   - `--highlight-color` background, white text, no border
   - padding 0.4rem 0.75rem, border-radius 6px, cursor pointer, **`font-size: 1rem`**
   - Hover: opacity 0.88, translateY(-1px)
   - Active: translateY(0)

### Rate Limit Badge

```css
.rate-limit-badge {
  display: none;
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: var(--hover-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}
```

### Inline Repo Form

```css
.repo-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 300px;
  padding: 1rem;
}

.repo-form label {
  font-size: 0.9rem;
  font-weight: bold;
}

.repo-form input {
  padding: 0.4rem 0.5rem;
  font-size: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--secondary-bg);
  color: var(--text-color);
  outline: none;
}

.repo-form input:focus {
  border-color: var(--highlight-color);
}
```

### Content Footer

```css
.content-footer {
  margin-top: 2rem;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-color);
  opacity: 0.7;
}

.content-footer p {
  margin: 0;
}

.content-footer a {
  color: var(--highlight-color);
  text-decoration: none;
}

.content-footer a:hover {
  text-decoration: underline;
}
```

### Back-to-Top Button

```css
.back-to-top {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 20;
  background-color: var(--highlight-color);
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.2rem;
  display: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  align-items: center;
  justify-content: center;
}
```

When shown, set `display: flex` (not `display: block`) so the arrow centers.

### Responsive (max-width: 768px)

- Sidebar shrinks to 25% width (`!important`)
- Resizer narrows to 4px
- File header stacks vertically (flex-direction column, align-items flex-start, gap 0.5rem)

---

## JavaScript

### Code Organization

The script is organized into these top-level arrow functions:
1. `escapeHTML` — utility
2. `CONFIG` and `state` — data
3. `storageKey` — utility
4. `updateHeaderFromConfig` — DOM update
5. `detectRepo` — async cascade
6. `initAppearance` — restore persisted settings
7. `setupListeners` — wire up all event handlers
8. `init` — async entry point

### Utility

```js
const escapeHTML = ( str ) => {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String( str ).replace( /[&<>"']/g, ( c ) => map[ c ] );
};
```

### CONFIG & Application State

```js
const CONFIG = {
  owner: '',   // empty = auto-detect
  repo: '',    // empty = auto-detect
  branch: '',  // empty = fetch default branch from API later
};

const state = {
  owner: '',
  repo: '',
  branch: '',
  tree: null,
  currentFilePath: '',
};
```

### Storage Key Helper

```js
const storageKey = ( suffix ) => `tootoo-lt:${ location.pathname }:${ suffix }`;
```

All per-instance localStorage keys use this to namespace by pathname.

### `updateHeaderFromConfig()`

Called after repo is detected. Reads from `state` (not CONFIG). Dynamically sets:
- `document.title` → `"owner / repo"`
- `#headerTitle` textContent → `"owner / repo"`
- `#headerGitHub` href → `https://github.com/owner/repo`

### `detectRepo()` Cascade

Returns a Promise (async function). Runs this cascade:

1. **URL query parameters** → `?owner=X&repo=Y&branch=Z` merged into CONFIG
2. **CONFIG already filled** → early return
3. **localStorage cache** → read `storageKey('repo')` JSON (`{owner, repo}`) — checked before `.git/config` to avoid noisy 404 console errors; early return if found
4. **GitHub Pages URL** → if `location.hostname` ends with `.github.io`, extract owner from the hostname subdomain and repo from the first pathname segment (falls back to `owner.github.io` for user pages with no path segment); cache result to localStorage; early return if found
5. **Fetch `.git/config`** → walk up the directory tree trying paths `''`, `'../'`, `'../../'`, `'../../../'`, `'../../../../'`; parse `github.com[:/]owner/repo` from remote URL; cache result to localStorage; early return if found
   - **5a**: On HTTP/HTTPS, use `fetch()`
   - **5b**: On `file://`, use synchronous `XMLHttpRequest` (fetch is CORS-blocked on file://); check `xhr.status === 200 || xhr.status === 0` and `xhr.responseText` is non-empty
6. **Show inline form** → render owner + repo input form in `#contentBody` using the `.repo-form` CSS class; return a new Promise that resolves when the user clicks "Set Repository"; form includes `id="inpOwner"`, `id="inpRepo"`, `id="btnSetRepo"` (class `primary`, `title="Set repository owner and name"`)

**Note**: `updateHeaderFromConfig()` is NOT called inside `detectRepo()` — it is called from `init()` after state is populated.

### `initAppearance()`

Called at the start of `init()`, before event listeners. Restores persisted settings:
- Dark mode: reads `storageKey('darkMode')`, if `'true'` adds `dark-mode` class to body and sets button text to ☀️
- Font size: reads `storageKey('fontSize')`, sets `--font-size` via `document.documentElement.style.setProperty`
- Sidebar width: reads `storageKey('sidebarWidth')`, sets `--sidebar-width` via `document.documentElement.style.setProperty`

### `setupListeners()`

Called after `initAppearance()`. Wires up all event handlers:

#### Dark Mode Toggle
- Click handler on `#btnDarkMode`
- Toggles `body.dark-mode` class
- Updates button text (☀️ when dark, 🌙 when light)
- Persists to `localStorage` via `storageKey('darkMode')`

#### Font Size Adjustment
- Helper: `getFontSize()` reads `--font-size` from computed style of `document.documentElement`, parses as int (default 16)
- `#btnFontInc`: clamp to max 28, step +2, set via `document.documentElement.style.setProperty('--font-size', sz + 'px')`
- `#btnFontDec`: clamp to min 10, step −2, same approach
- Persist to `localStorage` via `storageKey('fontSize')`

#### Help / About
- Async click handler on `#btnHelp`
- Reads `revised` from `<meta name="revised">` content
- Builds source URL and repo URL from `state.owner` / `state.repo` (falls back to `pushme-pullyou/tootoo`)
- Reads token from `localStorage.getItem('githubToken')`
- Fetches live rate limit from `https://api.github.com/rate_limit` (with auth header if token is set); extracts `resources.core.remaining`, `resources.core.limit`, and reset time formatted via `toLocaleTimeString()`
- Renders about panel in `#contentBody` with: source code link, repository link, copyright (pushme-pullyou authors), MIT license, build date, GitHub API section (repo visibility,token status + live rate limit, GitHub Pages support), tips section (filter, title reload, font size, dark mode)
- Sets `#contentTitle` to `"About"`
- All dynamic values passed through `escapeHTML()`

#### Token Prompt
- Click handler on `#btnToken`
- Reads current token from `localStorage.getItem('githubToken')` to pre-fill prompt
- `prompt()` dialog; if result is not null, save to `localStorage.setItem('githubToken', ...)` and `location.reload()`

#### Resizable Sidebar
- Pointer events on `#resizer` (pointerdown / pointermove / pointerup)
- `pointerdown`: `setPointerCapture`, add `.dragging` class, set `user-select: none` and `cursor: col-resize` on body
- `pointermove`: only if pointer is captured (`hasPointerCapture` check); calculate new width as `e.clientX` clamped between 100 and `window.innerWidth - 100`; set `--sidebar-width` on `document.documentElement`
- `pointerup`: `releasePointerCapture`, remove `.dragging` class, clear body styles, persist width to `localStorage`

#### Filter Input & Clear Button
- `input` handler on `#treeFilter`: show `#btnFilterClear` (`display: block`) when input has a value, hide otherwise
- `click` handler on `#btnFilterClear`: clear `#treeFilter` value, hide `#btnFilterClear`, return focus to `#treeFilter`

#### Back-to-Top Button
- Scroll handler on `#contentArea` (not window)
- Show `#btnBackToTop` (display flex) when scrollTop > 400, hide otherwise
- Click handler: `contentArea.scrollTo({ top: 0, behavior: 'smooth' })`

#### Header Title Reload
- Click handler on `#headerTitle`
- Clears `storageKey('currentFile')` from localStorage (so the next load shows README instead of restoring the last file)
- Calls `e.preventDefault()` then `location.reload()`

### `init()` — Async Entry Point

```js
const init = async () => {
  initAppearance();
  setupListeners();
  await detectRepo();
  state.owner = CONFIG.owner;
  state.repo = CONFIG.repo;
  state.branch = CONFIG.branch;
  if ( state.owner && state.repo ) {
    updateHeaderFromConfig();
    const cb = document.getElementById( 'contentBody' );
    cb.innerHTML = '<p>Ready — repo detected: <strong>' + escapeHTML( state.owner ) + ' / ' + escapeHTML( state.repo ) + '</strong></p>';
  }
};

init();
```

---

## What NOT to Include

- No GitHub API calls beyond `.git/config` fetch for auto-detect
- No file tree rendering
- No file content loading
- No markdown rendering libraries
- No hash routing
