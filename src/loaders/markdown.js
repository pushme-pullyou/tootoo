// markdown.js: Markdown → safe HTML (marked, then DOMPurify; both load at startup).
// Headings get GitHub-style ids, for '#file#heading' links. Relative links open the
// file inside the app; relative images, video and audio load through the source.
// HTML wrapped in '<!--@@@ … @@@-->' shows only in TooToo; web-page iframes are allowed.

const MarkdownLoader = {

  extensions: [ 'md', 'markdown', 'mkd', 'mdown', 'mkdn' ],
  toggle: () => true,

  // 'Getting Started!' → 'getting-started', as GitHub does.
  slug: ( text ) => text.toLowerCase().trim().replace( /[^\p{L}\p{N}\s_-]/gu, '' ).replace( /\s/g, '-' ),

  // Repeated headings get -1, -2, … as on GitHub.
  addHeadingIds: ( box ) => {
    const used = new Map();
    for ( const heading of box.querySelectorAll( 'h1, h2, h3, h4, h5, h6' ) ) {
      const base = MarkdownLoader.slug( heading.textContent );
      const count = used.get( base ) || 0;
      used.set( base, count + 1 );
      heading.id = count ? `${ base }-${ count }` : base;
    }
  },

  // A link inside the repo → { path, heading } of the file it opens, or null.
  // A folder opens its README; '#heading' alone stays in this file.
  target: ( file, href ) => {
    const [ beforeHash, ...rest ] = href.split( '#' );
    const heading = Router.decode( rest.join( '#' ) );
    const pathPart = beforeHash.split( '?' )[ 0 ];
    if ( ! pathPart ) { return { path: file.path, heading }; }
    const path = Loaders.resolvePath( file.path, pathPart );
    const item = ( state.tree || [] ).find( ( entry ) => entry.path === path );
    const opens = item && ( item.type === 'folder' ? Tree.readmeIn( path ) : path );
    return opens ? { path: opens, heading } : null;
  },

  fixLinks: ( box, file ) => {
    for ( const link of box.querySelectorAll( 'a[href]' ) ) {
      const href = link.getAttribute( 'href' );
      if ( Loaders.isExternal( href ) ) {
        link.target = '_blank';
        link.rel = 'noopener';
      } else {
        const target = MarkdownLoader.target( file, href );
        const heading = target && target.heading ? `#${ encodeURIComponent( target.heading ) }` : '';
        if ( target ) { link.setAttribute( 'href', `#${ Router.encodePath( target.path ) }${ heading }` ); }
      }
    }
  },

  // Relative images, video and audio (and a <video>'s <source>) load through the source.
  fixMedia: ( box, file ) => Promise.all( [ ...box.querySelectorAll( 'img[src], video[src], audio[src], source[src]' ) ].map( async ( media ) => {
    const src = media.getAttribute( 'src' );
    if ( Loaders.isExternal( src ) ) { return; }
    const path = Loaders.resolvePath( file.path, src.split( /[?#]/ )[ 0 ] );
    try {
      media.src = await Loaders.urlFor( file.source, path );
    } catch ( error ) {
      media.removeAttribute( 'src' );
      if ( media.tagName === 'IMG' ) { media.alt = `${ media.alt } (not found: ${ path })`; }
    }
  } ) ),

  // '<!--@@@ … @@@-->' is a comment, so GitHub hides it; TooToo drops the markers and shows what's inside.
  unwrap: ( text ) => text.replace( /<!--@@@([\s\S]*?)@@@-->/g, '$1' ),

  // An <iframe> stays only when it loads a web page (http: or https:).
  fixFrames: ( box ) => box.querySelectorAll( 'iframe' ).forEach( ( frame ) => {
    if ( ! /^https?:\/\//i.test( frame.getAttribute( 'src' ) || '' ) ) { frame.remove(); }
  } ),

  render: async ( file, element ) => {
    // A <template> is inert: images don't start loading from the wrong place while links are fixed.
    const template = document.createElement( 'template' );
    const html = marked.parse( MarkdownLoader.unwrap( await file.source.readText( file.path ) ) );
    template.innerHTML = DOMPurify.sanitize( html, { ADD_TAGS: [ 'iframe' ], ADD_ATTR: [ 'allow', 'allowfullscreen' ] } );
    const box = template.content;
    MarkdownLoader.fixFrames( box );
    MarkdownLoader.addHeadingIds( box );
    MarkdownLoader.fixLinks( box, file );
    await MarkdownLoader.fixMedia( box, file );
    const blocks = box.querySelectorAll( 'pre code' );
    if ( blocks.length ) {
      await Loaders.loadLibraries( CodeLoader.library ).catch( () => {} );   // plain code blocks if it can't load
      blocks.forEach( ( block ) => CodeLoader.highlight( block, ( block.className.match( /language-(\S+)/ ) || [] )[ 1 ] || '' ) );
    }
    const article = document.createElement( 'div' );
    article.className = 'markdown-body';
    article.append( box );
    element.replaceChildren( article );
  },

};
