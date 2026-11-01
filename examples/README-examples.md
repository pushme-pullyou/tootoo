# Examples

Sample content for exercising the TooToo file browser — both **tree/folder behavior** and **every file renderer** in [`../index.html`](../index.html). Point the app at this repo, open `examples/`, and click around.

This folder merges what used to be two separate folders (`sample-folders-and-files/` and `test-cases/`) into one tree organized by file type, so it's easy to find an example of any given format.

## Folder map

| Folder | What's inside |
| --- | --- |
| [`audio/`](audio/) | Audio playback (WAV; add MP3/AAC/FLAC/OGG to extend) |
| [`code/`](code/) | Plain text, source code, and unknown extensions → code-view fallback |
| [`data/`](data/) | JSON, YAML, CSV, and legacy Excel |
| [`docs/`](docs/) | Markdown documents and PDFs |
| [`html/`](html/) | HTML/HTM rendering in the sandboxed iframe (incl. nested [`samples/`](html/samples/)) |
| [`images/`](images/) | Raster images: PNG, JPG, GIF, BMP, WebP, ICO |
| [`projects/`](projects/) | Nested folders (up to 5 levels deep) for tree-navigation testing |
| [`svg/`](svg/) | Inline SVG rendering + raw-source toggle |
| [`video/`](video/) | Video playback: MP4, WebM |

## What to verify

1. Tree view rendering, indentation, and deep nesting (see `projects/`)
2. Folder expand/collapse, breadcrumbs, and auto-display of `README.md` on open
3. Markdown rendering — headings, lists, code, links, images (`docs/`)
4. Image, SVG, audio, video, and PDF viewers
5. HTML iframe rendering — and that embedded scripts do **not** execute (sandbox)
6. Raw/rendered toggle, filter/search, keyboard navigation

## Fixtures by renderer

### `renderMarkdown`

| File | Proves |
| --- | --- |
| [`docs/sample.md`](docs/sample.md) | Basic Markdown rendering |
| [`docs/markdown.md`](docs/markdown.md) | Mixed inline elements, links |
| [`docs/markdown-help.md`](docs/markdown-help.md) | Long-form Markdown, headings cascade |
| [`docs/code-of-conduct.md`](docs/code-of-conduct.md) | Real-world Markdown content |
| [`docs/concept.md`](docs/concept.md) | Misc Markdown |
| [`docs/text-to-hack.md`](docs/text-to-hack.md) | Markdown with inline HTML — DOMPurify must strip scripts |

### `renderHtml`

| File | Proves |
| --- | --- |
| [`html/readme.html`](html/readme.html) | Basic HTML rendering inside the sandbox iframe |
| [`html/markdown-help.html`](html/markdown-help.html) | Larger HTML doc |
| [`html/style-sample.htm`](html/style-sample.htm) | `.htm` extension is recognized |
| [`html/style-sample-tags.html`](html/style-sample-tags.html) | Element variety |
| [`html/text-to-hack.htm`](html/text-to-hack.htm) | Embedded scripts must NOT execute (sandbox) |
| [`html/text-to-hack-3.html`](html/text-to-hack-3.html) | Additional XSS vectors |
| [`html/samples/`](html/samples/) | More HTML fixtures, nested in subfolders |

### `renderImage`

| File | Proves |
| --- | --- |
| [`images/heritage-front.jpg`](images/heritage-front.jpg) | JPEG |
| [`images/the-scream.jpg`](images/the-scream.jpg) | JPEG (large) |
| [`images/envmap.png`](images/envmap.png) | PNG |
| [`images/DuckCM.png`](images/DuckCM.png) | PNG |
| [`images/system-map.gif`](images/system-map.gif) | GIF |

### `renderSvg`

| File | Proves |
| --- | --- |
| [`svg/noun_Information_585560.svg`](svg/noun_Information_585560.svg) | SVG renders inline; raw toggle shows source |

### `renderVideo`

| File | Proves |
| --- | --- |
| [`video/pano.mp4`](video/pano.mp4) | MP4 playback |
| [`video/Structural_MRI_animation.ogv.240p.webm`](video/Structural_MRI_animation.ogv.240p.webm) | WebM playback |

### `renderPdf`

| File | Proves |
| --- | --- |
| [`docs/Photo Album_Example Auckland.pdf`](docs/Photo%20Album_Example%20Auckland.pdf) | PDF in sandboxed iframe; spaces in filename are encoded |
| [`docs/sample.pdf`](docs/sample.pdf) | Small PDF |

### `renderSpreadsheet`

| File | Proves |
| --- | --- |
| [`data/ca_cs.xls`](data/ca_cs.xls) | Legacy Excel |
| [`data/us-county-state-latlon-pop.csv`](data/us-county-state-latlon-pop.csv) | CSV |
| [`data/sample.csv`](data/sample.csv) | Small CSV |

### `renderCode` (fallback)

| File | Proves |
| --- | --- |
| [`code/text.txt`](code/text.txt) | Plain text |
| [`code/file-names.txt`](code/file-names.txt) | Plain text with structured content |
| [`code/snippets.txt`](code/snippets.txt) | Misc text |
| [`code/code-sample.js`](code/code-sample.js) | JavaScript source |
| [`code/Duck1.obj`](code/Duck1.obj) / [`code/tree.obj`](code/tree.obj) | Unknown extension → code view |
| [`code/Duck1.mtl`](code/Duck1.mtl) | Unknown extension → code view |
| [`code/NPP_16.stl`](code/NPP_16.stl) | Unknown extension → code view |
| [`code/test-case.zip`](code/test-case.zip) | Binary — code view shows mojibake but doesn't crash |

## Adding a new fixture

1. Drop the file in the matching type folder (or a subfolder of it).
2. Add a row to the appropriate section above naming what it proves.
3. Prefer a small, named example over a generic "test" file — future-you wants to know *why* this fixture exists.

---

*Attribution: some 3D/data assets in `code/` are under [`code/LICENSE`](code/LICENSE) (MIT, © 2020 konturno).*
