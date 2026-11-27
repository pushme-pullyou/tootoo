// html.js: an HTML page, running in a frame, with a Raw view of its source.
//
// Where it can, the frame loads the real page, so its own scripts, styles and images work:
//   - on the repo's own Pages site, the published page;
//   - on file:// with a picked folder, the file beside this page, when it's the same file.
// Otherwise it gets a blob copy, where relative links and assets may not load. The blob copy
// is sandboxed, so it can't read this page's storage. The real page isn't: only open HTML you trust.
// A TooToo page is never previewed inside TooToo, so the app can't show itself forever.

const HtmlLoader = {

  extensions: [ 'html', 'htm' ],
  toggle: () => true,

  isTooToo: ( text ) => text.includes( 'TOOTOO_CONFIG' ),

  sandbox: 'allow-scripts allow-forms allow-popups',   // for a blob copy: everything but this page's storage

  // The published page, when this app runs on the repo's own <owner>.github.io site.
  pagesUrl: ( path ) => {
    const host = `${ state.owner.toLowerCase() }.github.io`;
    if ( ! state.source || state.source.name !== 'github' || location.hostname !== host ) { return ''; }
    if ( state.repo.toLowerCase() === host ) { return `${ location.origin }/${ Router.encodePath( path ) }`; }
    const first = location.pathname.split( '/' ).filter( Boolean )[ 0 ] || '';
    return first.toLowerCase() === state.repo.toLowerCase() ? `${ location.origin }/${ first }/${ Router.encodePath( path ) }` : '';
  },

  // On file://, the picked folder is often the folder this page sits in: use the real file if it matches.
  localUrl: async ( file ) => {
    if ( location.protocol !== 'file:' || file.source.name !== 'local' ) { return ''; }
    const url = new URL( Router.encodePath( file.path ), location.href ).href;
    try {
      const blob = await ( await fetch( url ) ).blob();
      return blob.size === file.size ? url : '';
    } catch ( error ) { return ''; }
  },

  render: async ( file, element ) => {
    const text = await file.source.readText( file.path );
    if ( HtmlLoader.isTooToo( text ) ) {
      element.innerHTML = '<p class="message">This is a TooToo page, so it isn\'t previewed inside TooToo. Use ↗ New tab, or Raw for its source.</p>';
      return;
    }
    const real = HtmlLoader.pagesUrl( file.path ) || await HtmlLoader.localUrl( file );
    const frame = document.createElement( 'iframe' );
    frame.className = 'html-view';
    frame.title = file.name;
    // A blob copy would run as this page's own site, able to read the saved GitHub token.
    // The sandbox (no allow-same-origin) keeps its scripts running but walled off.
    if ( ! real ) { frame.setAttribute( 'sandbox', HtmlLoader.sandbox ); }
    frame.src = real || Loaders.track( URL.createObjectURL( new Blob( [ text ], { type: 'text/html' } ) ) );
    element.replaceChildren( frame );
  },

};
