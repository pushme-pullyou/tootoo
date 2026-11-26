// test-loaders.js: Stage 4, each sample file renders the right element; libraries load once;
// unknown types fall back. Markdown and code need marked, DOMPurify and highlight.js from the CDN.

// Renders one mock file into a fresh box, with the mock as the source and its tree in state.
const renderMock = async ( path, options = {} ) => {
  state.source = MockSource;
  state.tree = await MockSource.listTree();
  const box = document.createElement( 'div' );
  const size = MockSource.blobOf( path ).size;
  await Loaders.render( { path, name: path.split( '/' ).pop(), ext: Loaders.extOf( path ), size, source: MockSource }, box, options );
  return box;
};

// Adds files to the mock for one test.
const withMockFiles = async ( files, fn ) => {
  Object.assign( MockSource.files, files );
  try { return await fn(); } finally { Object.keys( files ).forEach( ( path ) => delete MockSource.files[ path ] ); }
};

test( 'loaders: Markdown has headings with ids', async () => {
  const box = await renderMock( 'README.md' );
  assertEqual( box.querySelector( 'h1' ).textContent, 'Mock repo' );
  assertEqual( [ ...box.querySelectorAll( 'h2' ) ].map( ( h ) => h.id ), [ 'getting-started', 'details' ] );
  assertEqual( box.querySelector( 'a' ).getAttribute( 'href' ), '#docs/guide.md', 'a relative link opens in the app:' );
} );

test( 'loaders: Markdown links, images and repeated headings', () => withMockFiles( {
  'docs/links.md': '# Install\n\n# Install\n\n[a](#install) [b](guide.md#install) [c](../README.md) [d](https://example.com) '
    + '[e](missing.md) [f](../blog/) [g](./)\n\n![p](../media/pixel.png)\n\n```js\nconst x = 1;\n```\n',
}, async () => {
  const box = await renderMock( 'docs/links.md' );
  assertEqual( [ ...box.querySelectorAll( 'h1' ) ].map( ( h ) => h.id ), [ 'install', 'install-1' ] );
  const hrefs = [ ...box.querySelectorAll( 'a' ) ].map( ( a ) => a.getAttribute( 'href' ) );
  assertEqual( hrefs, [ '#docs/links.md#install', '#docs/guide.md#install', '#README.md', 'https://example.com', 'missing.md', '../blog/', '#docs/README.md' ], 'a folder without a README stays as written:' );
  assertEqual( box.querySelector( 'a[href^="https"]' ).target, '_blank' );
  assert( box.querySelector( 'img' ).src.startsWith( 'blob:' ), 'the image loads through the source' );
  assert( box.querySelector( 'pre code.hljs .hljs-keyword' ), 'the code block is highlighted' );
} ) );

test( 'loaders: Markdown video and audio load through the source', () => withMockFiles( {
  'docs/clips.md': '<video controls>\n  <source src="../media/clip.mp4" type="video/mp4">\n</video>\n\n<audio controls src="../media/clip.mp4"></audio>\n',
}, async () => {
  const box = await renderMock( 'docs/clips.md' );
  assert( box.querySelector( 'video source' ).src.startsWith( 'blob:' ), 'a <source> inside <video>: ' + box.innerHTML );
  assert( box.querySelector( 'audio' ).src.startsWith( 'blob:' ), 'an <audio src>: ' + box.innerHTML );
} ) );

test( 'loaders: Markdown is sanitized', () => withMockFiles( {
  'docs/unsafe.md': '<img src=x onerror="window.unsafeRan = true">\n\n<script>window.unsafeRan = true</script>\n',
}, async () => {
  const box = await renderMock( 'docs/unsafe.md' );
  assert( ! box.querySelector( 'script' ) && ! box.querySelector( '[onerror]' ), box.innerHTML );
} ) );

test( 'loaders: code is highlighted', async () => {
  const box = await renderMock( 'code/app.js' );
  assert( box.querySelector( 'pre.code-view code.hljs .hljs-keyword' ), box.innerHTML.slice( 0, 200 ) );
} );

test( 'loaders: images, SVG, video', async () => {
  assert( ( await renderMock( 'media/pixel.png' ) ).querySelector( 'img.media-view[alt="pixel.png"]' ), 'png' );
  const svg = ( await renderMock( 'media/logo.svg' ) ).querySelector( 'img' );
  assert( svg && svg.src.startsWith( 'blob:' ), 'svg as an image' );
  assert( ( await renderMock( 'media/logo.svg', { raw: true } ) ).querySelector( 'pre.code-view' ), 'svg raw shows source' );
  const video = ( await renderMock( 'media/clip.mp4' ) ).querySelector( 'video' );
  assert( video && video.controls, 'video' );
} );

test( 'loaders: PDF, CSV and HTML', async () => {
  assert( ( await renderMock( 'docs/paper.pdf' ) ).querySelector( 'iframe.pdf-view' ), 'pdf frame' );
  const table = ( await renderMock( 'data/table.csv' ) ).querySelector( 'table' );
  assertEqual( [ ...table.querySelectorAll( 'th' ) ].map( ( th ) => th.textContent ), [ 'name', 'count' ] );
  assertEqual( table.querySelectorAll( 'tbody tr' ).length, 2 );
  const frame = ( await renderMock( 'pages/demo.html' ) ).querySelector( 'iframe.html-view' );
  assert( frame && frame.src.startsWith( 'blob:' ), 'html frame from a blob copy here' );
  assert( ( await renderMock( 'pages/demo.html', { raw: true } ) ).querySelector( 'pre.code-view' ), 'html raw' );
} );

test( 'loaders: a TooToo page is never previewed inside TooToo', () => withMockFiles( {
  'pages/tootoo.html': '<script>window.TOOTOO_CONFIG = {};</script>',
}, async () => {
  const box = await renderMock( 'pages/tootoo.html' );
  assert( ! box.querySelector( 'iframe' ) && box.textContent.includes( 'TooToo page' ), box.innerHTML );
} ) );

test( 'loaders: plain text, unknown text, unknown binary', () => withMockFiles( { 'misc/settings.conf': 'a = 1\n' }, async () => {
  assert( ( await renderMock( 'notes.txt' ) ).querySelector( 'pre.text-view' ), 'txt' );
  assertEqual( ( await renderMock( 'misc/settings.conf' ) ).querySelector( 'pre.text-view' ).textContent, 'a = 1\n' );
  assert( ( await renderMock( 'data/sample.bin' ) ).textContent.includes( 'No preview' ), 'binary offers download' );
} ) );

test( 'loaders: a library loads once, with a note meanwhile', async () => {
  const fake = { extensions: [ 'fake' ], library: [ '../tests/fake-library.js' ], render: async ( file, element ) => { element.textContent = 'ok'; } };
  Loaders.list.push( fake );
  const notes = [];
  try {
    await withMockFiles( { 'x.fake': 'one', 'y.fake': 'two' }, async () => {
      await renderMock( 'x.fake', { notice: ( text ) => notes.push( text ) } );
      await renderMock( 'y.fake' );
    } );
  } finally { Loaders.list.pop(); }
  assertEqual( window.fakeLibraryLoads, 1 );
  assertEqual( notes, [ 'Loading…' ] );
} );

test( 'loaders: which types toggle, which copy, and path resolving', () => {
  assertEqual( [ 'README.md', 'notes.txt', 'media/logo.svg', 'media/pixel.png', 'data/table.csv', 'pages/demo.html' ].map( Loaders.canToggle ),
    [ true, false, true, false, true, true ] );
  assertEqual( [ 'a.md', 'a.png', 'a.pdf', 'a.zip', 'a.conf' ].map( Loaders.isText ), [ true, false, false, false, true ] );
  assertEqual( Loaders.resolvePath( 'docs/a.md', '../img/x%20y.png' ), 'img/x y.png' );
  assertEqual( Loaders.resolvePath( 'docs/a.md', './b.md' ), 'docs/b.md' );
  assertEqual( Loaders.resolvePath( 'docs/a.md', '/top.md' ), 'top.md' );
  assertEqual( Loaders.resolvePath( 'a.md', '../../out.md' ), '' );
} );

test( 'loaders: CSV quotes, commas and line breaks', () => {
  assertEqual( CsvLoader.parse( 'a,"b, c","say ""hi"""\r\n1,"two\nlines",3' ), [ [ 'a', 'b, c', 'say "hi"' ], [ '1', 'two\nlines', '3' ] ] );
  assertEqual( CsvLoader.parse( 'a\tb\n', '\t' ), [ [ 'a', 'b' ] ] );
} );
