// github.js: the GitHub source. The four-function contract (SPEC.md §4) over the REST API,
// reading the repo from state.owner / repo / branch.
//
// Errors carry a `kind`, so the UI can say the right thing:
//   rate-limit, private, bad-token   → error.needsToken is true: open the token panel
//   missing-branch                   → the repo is readable, the branch isn't there
//   too-large                        → the tree is over GitHub's listing limit
//   not-found, http                  → a single file failed
//
// Without a token, files come from raw.githubusercontent.com (no API quota). With one,
// they come through the Contents API, which also serves private repos.

const GitHub = {

  name: 'github',

  messages: {
    'rate-limit': 'GitHub\'s limit of 60 requests an hour without a token is used up. Add a token for 5,000 an hour.',
    'bad-token': 'GitHub refused the saved token. Replace it or remove it.',
    private: 'Repository not found. Check the owner and repository names. If it\'s private, add a token with read access.',
    'missing-branch': 'Branch "{branch}" not found in {repo}.',
    'too-large': '{repo} is over GitHub\'s limit for one tree listing (100,000 files or 7 MB), so it can\'t be browsed here.',
  },

  // A clear error. `detail` fills the {branch} and {repo} blanks.
  errorFor: ( kind, message = GitHub.messages[ kind ], detail = {} ) => Object.assign(
    new Error( message.replace( /\{(\w+)\}/g, ( blank, name ) => detail[ name ] || '' ) ),
    { kind, needsToken: [ 'rate-limit', 'private', 'bad-token' ].includes( kind ) } ),

  // ── The token: optional, saved in this browser under storagePrefix ──

  storage: () => window.localStorage,   // tests swap in a fake
  tokenKey: () => `${ CONFIG.storagePrefix }:githubToken`,

  getToken: () => {
    try { return GitHub.storage().getItem( GitHub.tokenKey() ) || ''; } catch ( error ) { return ''; }
  },

  setToken: ( token ) => {
    try {
      if ( token ) { GitHub.storage().setItem( GitHub.tokenKey(), token ); } else { GitHub.storage().removeItem( GitHub.tokenKey() ); }
    } catch ( error ) { /* storage blocked: the token lasts until the page closes */ }
  },

  // ── Requests ──

  request: ( url, options ) => fetch( url, options ),   // tests swap in canned responses

  headers: () => {
    const token = GitHub.getToken();
    return token ? { Accept: 'application/vnd.github+json', Authorization: `token ${ token }` } : { Accept: 'application/vnd.github+json' };
  },

  // Passes an OK response through; anything else becomes a clear error.
  check: ( response, what ) => {
    if ( response.ok ) { return response; }
    if ( response.status === 401 ) { throw GitHub.errorFor( 'bad-token' ); }
    if ( response.status === 403 || response.status === 429 ) { throw GitHub.errorFor( 'rate-limit' ); }
    if ( response.status === 404 ) { throw GitHub.errorFor( 'not-found', `Not found: ${ what }` ); }
    throw GitHub.errorFor( 'http', `GitHub error ${ response.status } for ${ what }` );
  },

  repoName: () => `${ state.owner }/${ state.repo }`,
  apiUrl: ( rest = '' ) => `https://api.github.com/repos/${ encodeURIComponent( state.owner ) }/${ encodeURIComponent( state.repo ) }${ rest }`,
  rawUrl: ( path ) => `https://raw.githubusercontent.com/${ encodeURIComponent( state.owner ) }/${ encodeURIComponent( state.repo ) }/${ encodeURIComponent( state.branch ) }/${ Router.encodePath( path ) }`,

  api: async ( rest = '' ) => {
    const response = await GitHub.request( GitHub.apiUrl( rest ), { headers: GitHub.headers() } );
    return GitHub.check( response, GitHub.repoName() ).json();
  },

  // ── The four functions ──

  // The whole tree in one call. An empty branch is first set to the repo's default branch.
  listTree: async () => {
    const detail = { repo: GitHub.repoName(), branch: state.branch };
    try {
      if ( ! state.branch ) { state.branch = ( await GitHub.api() ).default_branch; }
      const data = await GitHub.api( `/git/trees/${ encodeURIComponent( state.branch ) }?recursive=1` );
      if ( data.truncated ) { throw GitHub.errorFor( 'too-large', undefined, detail ); }
      return data.tree
        .filter( ( item ) => item.type === 'blob' || item.type === 'tree' )   // skip submodules
        .map( ( item ) => ( { path: item.path, type: item.type === 'tree' ? 'folder' : 'file', size: item.size || 0 } ) );
    } catch ( error ) {
      if ( error.kind !== 'not-found' ) { throw error; }
      // A tree 404 means a missing or private repo, or only a bad branch in a readable repo.
      const readable = await GitHub.api().then( () => true, () => false );
      throw GitHub.errorFor( readable ? 'missing-branch' : 'private', undefined, detail );
    }
  },

  fetchFile: async ( path ) => {
    const token = GitHub.getToken();
    const response = token
      ? await GitHub.request( GitHub.apiUrl( `/contents/${ Router.encodePath( path ) }?ref=${ encodeURIComponent( state.branch ) }` ),
        { headers: { ...GitHub.headers(), Accept: 'application/vnd.github.raw+json' } } )
      : await GitHub.request( GitHub.rawUrl( path ) );
    return GitHub.check( response, path );
  },

  // Text is cached for the session: the last 50 files, per owner / repo / branch.
  cache: new Map(),

  readText: async ( path ) => {
    const key = `${ GitHub.repoName() }/${ state.branch }/${ path }`;
    if ( ! GitHub.cache.has( key ) ) {
      GitHub.cache.set( key, await ( await GitHub.fetchFile( path ) ).text() );
      if ( GitHub.cache.size > 50 ) { GitHub.cache.delete( GitHub.cache.keys().next().value ); }
    }
    return GitHub.cache.get( key );
  },

  readBlob: async ( path ) => ( await GitHub.fetchFile( path ) ).blob(),

  // A public raw URL, or with a token (maybe a private repo) a blob URL of the file.
  fileUrl: async ( path ) => GitHub.getToken() ? URL.createObjectURL( await GitHub.readBlob( path ) ) : GitHub.rawUrl( path ),

  // ── Which repo to show ──

  // ?owner=&repo= first, then CONFIG, then the *.github.io address it's served from.
  // ?branch= applies to any of them.
  detectRepo: ( href = location.href, config = CONFIG ) => {
    const url = new URL( href );
    const param = ( name ) => url.searchParams.get( name ) || '';
    const branch = param( 'branch' );
    if ( param( 'owner' ) && param( 'repo' ) ) { return { owner: param( 'owner' ), repo: param( 'repo' ), branch }; }
    if ( config.owner && config.repo ) { return { owner: config.owner, repo: config.repo, branch: branch || config.branch }; }
    if ( url.hostname.endsWith( '.github.io' ) ) {
      // theo-armour.github.io/pages/… → theo-armour/pages; the root site → theo-armour/theo-armour.github.io
      const owner = url.hostname.split( '.' )[ 0 ];
      const first = url.pathname.split( '/' ).filter( Boolean )[ 0 ] || '';
      return { owner, repo: first && ! /\.html?$/i.test( first ) ? first : url.hostname, branch };
    }
    return { owner: '', repo: '', branch: '' };
  },

};
