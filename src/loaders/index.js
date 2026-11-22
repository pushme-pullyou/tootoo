// index.js: picks the loader for a file and runs it (SPEC.md §4).
// A loader is { extensions, library?, toggle?( ext ), render( file, element ) }:
//   library: pinned CDN URLs, loaded once per page, the first time a file needs them;
//   toggle: true when the type has a Raw view (shown by the code loader).
// An unknown type is shown as text, unless its first bytes say it's binary: then download.

const Loaders = {

  list: [ MarkdownLoader, CodeLoader, MediaLoader, PdfLoader, CsvLoader, HtmlLoader, TextLoader ],

  // Types with no preview: offered for download without being read first.
  binary: [ 'zip', 'gz', 'tgz', '7z', 'rar', 'exe', 'dll', 'msi', 'docx', 'xlsx', 'pptx', 'odt', 'ods', 'woff', 'woff2',
    'ttf', 'otf', 'eot', 'psd', 'ai', 'glb', 'stl', 'class', 'jar', 'pyc', 'wasm', 'sqlite', 'db' ],

  download: {
    extensions: [],
    render: ( file, element ) => {
      element.innerHTML = `<p class="message">No preview for ${ Shell.escape( file.name ) }. Use ⬇ Download above.</p>`;
    },
  },

  textLimit: 2000000,   // bytes: bigger text files are offered for download instead

  extOf: ( path ) => {
    const name = path.split( '/' ).pop();
    return name.includes( '.' ) ? name.split( '.' ).pop().toLowerCase() : '';
  },

  find: ( ext ) => Loaders.list.find( ( loader ) => loader.extensions.includes( ext ) ),

  canToggle: ( path ) => {
    const loader = Loaders.find( Loaders.extOf( path ) );
    return Boolean( loader && loader.toggle && loader.toggle( Loaders.extOf( path ) ) );
  },

  // Whether Copy makes sense: text types, and unknown types (which are usually text).
  isText: ( path ) => {
    const ext = Loaders.extOf( path );
    return ! Loaders.binary.includes( ext ) && ! [ MediaLoader, PdfLoader ].includes( Loaders.find( ext ) );
  },

  // ── Libraries: one <script> or <link> per URL per page ──

  loaded: new Map(),   // url → Promise

  loadLibrary: ( url ) => {
    if ( ! Loaders.loaded.has( url ) ) {
      Loaders.loaded.set( url, new Promise( ( resolve, reject ) => {
        const css = url.endsWith( '.css' );
        const tag = document.createElement( css ? 'link' : 'script' );
        if ( css ) { tag.rel = 'stylesheet'; tag.href = url; } else { tag.src = url; }
        tag.onload = resolve;
        tag.onerror = () => { Loaders.loaded.delete( url ); reject( new Error( `Could not load ${ url }` ) ); };
        document.head.append( tag );
      } ) );
    }
    return Loaders.loaded.get( url );
  },

  loadLibraries: ( urls = [] ) => Promise.all( urls.map( Loaders.loadLibrary ) ),

  // ── Paths and URLs ──

  isExternal: ( href ) => /^([a-z][a-z0-9+.-]*:|\/\/)/i.test( href ),   // https:, mailto:, data:, //host

  // 'docs/a.md' + '../img/x.png' → 'img/x.png'. '/x' starts at the repo root. '' if it leaves the repo.
  resolvePath: ( fromFile, href ) => {
    const parts = href.startsWith( '/' ) ? [] : fromFile.split( '/' ).slice( 0, -1 );
    for ( const part of href.split( '/' ) ) {
      if ( part === '..' && ! parts.length ) { return ''; }
      if ( part === '..' ) { parts.pop(); } else if ( part && part !== '.' ) { parts.push( Router.decode( part ) ); }
    }
    return parts.join( '/' );
  },

  // MIME types the browser needs to show a file inline (raw GitHub sends many as plain bytes).
  types: { svg: 'image/svg+xml', pdf: 'application/pdf', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
    m4a: 'audio/mp4', flac: 'audio/flac', mp4: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg', mov: 'video/quicktime' },

  urls: [],   // blob URLs made for the open file, freed when the next one opens
  track: ( url ) => { Loaders.urls.push( url ); return url; },

  // A URL for <img>, <video>, <iframe>: GitHub's own URL where it serves the right type, else a typed blob URL.
  urlFor: async ( source, path ) => {
    const type = Loaders.types[ Loaders.extOf( path ) ];
    if ( source.name === 'github' && ! type ) { return source.fileUrl( path ); }
    const blob = await source.readBlob( path );
    return Loaders.track( URL.createObjectURL( type ? new Blob( [ blob ], { type } ) : blob ) );
  },

  // ── Render ──

  // An unknown type: binary when its first 4 KB hold a zero byte.
  sniff: async ( file ) => {
    const start = await ( await file.source.readBlob( file.path ) ).slice( 0, 4096 ).arrayBuffer();
    return new Uint8Array( start ).includes( 0 ) ? Loaders.download : TextLoader;
  },

  // options: { raw: show the source, notice( text ): say what's happening meanwhile }
  render: async ( file, element, { raw = false, notice = () => {} } = {} ) => {
    Loaders.urls.splice( 0 ).forEach( ( url ) => URL.revokeObjectURL( url ) );
    const found = Loaders.find( file.ext ) || ( Loaders.binary.includes( file.ext ) ? Loaders.download : await Loaders.sniff( file ) );
    const loader = raw && found.toggle && found.toggle( file.ext ) ? CodeLoader : found;
    const readsText = [ MarkdownLoader, CodeLoader, CsvLoader, TextLoader ].includes( loader );
    if ( readsText && file.size > Loaders.textLimit ) {
      element.innerHTML = `<p class="message">${ Shell.escape( file.name ) } is too large to show here. Use ⬇ Download above.</p>`;
      return;
    }
    if ( loader.library ) {
      notice( 'Loading…' );
      await Loaders.loadLibraries( loader.library ).catch( () => {} );   // without it, code shows unhighlighted
    }
    await loader.render( file, element );
  },

};
