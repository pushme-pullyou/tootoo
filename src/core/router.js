// router.js: the address bar.
//
//   index.html?owner=theo-armour&repo=pages&branch=main#docs/read%20me.md#getting-started
//              └──────────── the repo (query) ────────┘ └─ file path ──┘ └─ heading ──┘
//
// Each path segment and the heading are percent-encoded, so a '#' inside a name
// (%23) never splits the hash. Other query params (e.g. ?source=mock) are kept.

const Router = {

  // decodeURIComponent, but a broken escape gives the raw text instead of throwing.
  decode: ( text ) => {
    try { return decodeURIComponent( text ); } catch ( error ) { return text; }
  },

  // 'docs/read me.md' → 'docs/read%20me.md': each segment encoded, slashes kept.
  encodePath: ( path ) => path.split( '/' ).map( encodeURIComponent ).join( '/' ),

  // A URL string → { owner, repo, branch, path, heading }, with '' for anything missing.
  parse: ( href ) => {
    const url = new URL( href );
    const get = ( name ) => url.searchParams.get( name ) || '';
    const hash = url.hash.slice( 1 );
    const split = hash.indexOf( '#' );
    const path = split === -1 ? hash : hash.slice( 0, split );
    const heading = split === -1 ? '' : hash.slice( split + 1 );
    return { owner: get( 'owner' ), repo: get( 'repo' ), branch: get( 'branch' ),
      path: Router.decode( path ), heading: Router.decode( heading ) };
  },

  // { owner, repo, branch, path, heading } → a URL string based on `base`.
  // Empty parts are left out.
  build: ( { owner = '', repo = '', branch = '', path = '', heading = '' }, base = location.href ) => {
    const url = new URL( base );
    for ( const [ name, value ] of Object.entries( { owner, repo, branch } ) ) {
      if ( value ) { url.searchParams.set( name, value ); } else { url.searchParams.delete( name ); }
    }
    const encodedPath = Router.encodePath( path );
    const fragment = heading ? `${ encodedPath }#${ encodeURIComponent( heading ) }` : encodedPath;
    // The hash setter drops one leading '#', so add it ourselves: '##top' keeps an empty path.
    url.hash = fragment ? `#${ fragment }` : '';
    return url.href;
  },

  // The address bar right now, parsed. Content reads this after the tree loads, for deep links.
  current: () => Router.parse( location.href ),

  // Writes the repo fields and tells everyone.
  setRepo: ( { owner = '', repo = '', branch = '' } ) => {
    state.owner = owner;
    state.repo = repo;
    state.branch = branch;
    Events.emit( 'repo-changed', { owner, repo, branch } );
  },

  // The hash changed (a link or the back button): ask content to open that file.
  onHashChange: () => {
    const { path, heading } = Router.current();
    Events.emit( 'open-requested', { path, heading } );
  },

  // Called once at startup with the detected repo, e.g. Router.start( GitHub.detectRepo() ).
  start: ( repo ) => {
    window.addEventListener( 'hashchange', Router.onHashChange );
    Router.setRepo( repo );
  },

};
