# TooToo — File Content Viewer

## Content Area Structure

When a file is selected, the content area shows:

```
<div class="file-header">  (sticky, stays at top while scrolling)
  <h3 class="file-title">
    repo-link / path / filename
    GitHub icon link (opens source on GitHub)
  </h3>
  <div class="file-actions">
    "New Tab" button (opens file in new tab)
    Rendered/Raw toggle (for markdown and HTML files)
  </div>
</div>
<div id="viewRendered">  (rendered content)
<div id="viewRaw">  (raw source, hidden by default)
```

## File Type Handling

### Markdown (.md)
- Rendered using `marked.js` (CDN) into a `.markdown-body` div
- Styled with white background, border, rounded corners
- Raw view available via toggle (shows source in `<pre><code>`)
- Internal links rewritten:
  - GitHub blob links → navigate within the app
  - Relative paths → resolved against current directory
  - External links → `target="_blank" rel="noopener"`
- If `marked.parse()` throws, show error banner + raw fallback

### Code / Text Files
- Displayed in `<pre><code class="language-{ext}">` block
- Syntax highlighted via `highlight.js` (CDN, GitHub theme)
- `hljs.highlightAll()` called after content insertion

### Images (.png, .jpg, .jpeg, .gif, .webp, .svg, .ico)
- Displayed inline with `max-width: 100%`
- SVG files also offer raw view toggle (shows SVG source)

### Audio (.mp3, .wav, .ogg)
- HTML5 `<audio>` player with controls, full width

### Video (.mp4, .webm)
- HTML5 `<video>` player with controls, max-width styling

### PDF (.pdf)
- Embedded via Google Docs Viewer: `https://docs.google.com/viewer?url={encoded-url}&embedded=true`
- Displayed in an iframe (80vh height)

### HTML (.html, .htm)
- Raw source fetched, converted to Blob URL
- Embedded in `<iframe sandbox="allow-scripts">`
- Raw/Rendered toggle available
- "New Tab" opens the GitHub Pages URL: `https://{owner}.github.io/{repo}/{path}`

### Binary / Unknown
- Same as text: shown in `<pre>` block (may not be useful for true binaries)

## Large File Protection

- Threshold: `LARGE_FILE_WARNING_BYTES = 1024 * 1024` (1 MB)
- Files exceeding threshold trigger a `window.confirm()` dialog
- Approved files tracked in `approvedLargeFiles` Set (per session)
- File size read from tree API response (`item.size`)

## File Header Details

- Repo name is a clickable link that navigates back to the repo tree root
- Path segments shown with `/` separators
- GitHub icon links to the file on GitHub (or gist URL for gist files)
- "New Tab" button:
  - Repos: opens GitHub Pages URL
  - Gists: opens raw content URL

## Rendered ↔ Raw Toggle

- Two-button toggle: "Rendered" and "Raw"
- Active button has full opacity, inactive has 0.5 opacity
- Toggles `display: block/none` on `#viewRendered` and `#viewRaw` divs
- Only shown for file types that have both views (markdown, HTML, SVG)
