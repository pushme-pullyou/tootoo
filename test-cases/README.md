# Test Cases

A grab-bag of files that exercise every renderer in [`../index.html`](../index.html). Use this folder when you change a render pipeline and want to confirm nothing regressed.

## How to use

Open the app pointing at this repo, navigate into `test-cases/`, and click each file. Each row in the table below names what should appear; if anything looks wrong, the renderer it ties to is the place to look.

## Fixtures by renderer

### `renderMarkdown`

| File | Proves |
| --- | --- |
| [`sample.md`](sample.md) | Basic Markdown rendering |
| [`markdown.md`](markdown.md) | Mixed inline elements, links |
| [`markdown-help.md`](markdown-help.md) | Long-form Markdown, headings cascade |
| [`code-of-conduct.md`](code-of-conduct.md) | Real-world Markdown content |
| [`concept.md`](concept.md) | Misc Markdown |
| [`text-to-hack.md`](text-to-hack.md) | Markdown with inline HTML — DOMPurify must strip scripts |

### `renderHtml`

| File | Proves |
| --- | --- |
| [`readme.html`](readme.html) | Basic HTML rendering inside the sandbox iframe |
| [`markdown-help.html`](markdown-help.html) | Larger HTML doc |
| [`style-sample.htm`](style-sample.htm) | `.htm` extension is recognized |
| [`style-sample-tags.html`](style-sample-tags.html) | Element variety |
| [`text-to-hack.html`](text-to-hack.html) | Embedded scripts must NOT execute (sandbox) |
| [`text-to-hack-3.html`](text-to-hack-3.html) | Additional XSS vectors |
| [`html-samples/`](html-samples/) | More HTML fixtures |

### `renderImage`

| File | Proves |
| --- | --- |
| [`heritage-front.jpg`](heritage-front.jpg) | JPEG |
| [`the-scream.jpg`](the-scream.jpg) | JPEG (large) |
| [`envmap.png`](envmap.png) | PNG |
| [`DuckCM.png`](DuckCM.png) | PNG |
| [`system-map.gif`](system-map.gif) | GIF |

### `renderSvg`

| File | Proves |
| --- | --- |
| [`noun_Information_585560.svg`](noun_Information_585560.svg) | SVG renders inline; raw toggle shows source |

### `renderVideo`

| File | Proves |
| --- | --- |
| [`pano.mp4`](pano.mp4) | MP4 playback |
| [`Structural_MRI_animation.ogv.240p.webm`](Structural_MRI_animation.ogv.240p.webm) | WebM playback |

### `renderPdf`

| File | Proves |
| --- | --- |
| [`Photo Album_Example Auckland.pdf`](Photo%20Album_Example%20Auckland.pdf) | PDF in sandboxed iframe; spaces in filename are encoded |

### `renderSpreadsheet`

| File | Proves |
| --- | --- |
| [`ca_cs.xls`](ca_cs.xls) | Legacy Excel |
| [`us-county-state-latlon-pop.csv`](us-county-state-latlon-pop.csv) | CSV |

### `renderCode` (fallback)

| File | Proves |
| --- | --- |
| [`text.txt`](text.txt) | Plain text |
| [`file-names.txt`](file-names.txt) | Plain text with structured content |
| [`snippets.txt`](snippets.txt) | Misc text |
| [`Duck1.obj`](Duck1.obj) / [`tree.obj`](tree.obj) | Unknown extension → code view |
| [`Duck1.mtl`](Duck1.mtl) | Unknown extension → code view |
| [`NPP_16.stl`](NPP_16.stl) | Unknown extension → code view |
| [`test-case.zip`](test-case.zip) | Binary — code view shows mojibake but doesn't crash |

## Adding a new fixture

1. Drop the file in this folder (or a subfolder).
2. Add a row to the appropriate section above naming what it proves.
3. If you're proving a new renderer or a new edge case, prefer a small, named example over a general "test" file — future-you wants to know *why* this fixture exists.
