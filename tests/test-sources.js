// test-sources.js: Stage 2, the mock, the local source and the GitHub source (no network).

// ── The contract ──

test( 'sources: the mock keeps the source contract', () => checkSourceContract( MockSource, 'README.md' ) );

test( 'sources: the mock has every sample the later stages need', async () => {
  const paths = ( await MockSource.listTree() ).map( ( item ) => item.path );
  for ( const path of [ 'README.md', 'docs/README.md', 'blog/11-November', 'notes-2026-11-21-08-30.md', 'index.bak',
    'Images', '.github', 'code/app.js', 'media/pixel.png', 'media/clip.mp4', 'media/logo.svg', 'docs/paper.pdf',
    'data/table.csv', 'pages/demo.html', 'notes.txt', 'data/sample.bin' ] ) {
    assert( paths.includes( path ), `the mock is missing ${ path }` );
  }
  assertEqual( ( await MockSource.readBlob( 'media/pixel.png' ) ).type, 'image/png' );
} );

// ── Local: fake folder handles and uploaded files ──

const fakeFile = ( name, text ) => ( { kind: 'file', name, getFile: async () => new File( [ text ], name, { type: 'text/plain' } ) } );
const fakeFolder = ( name, children ) => ( { kind: 'directory', name, values: () => children.values() } );
const gitConfig = '[core]\n\tbare = false\n[remote "origin"]\n\turl = https://github.com/theo-armour/pages.git\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n';

const fakeClone = () => fakeFolder( 'pages', [
  fakeFile( 'README.md', '# Pages\n' ),
  fakeFolder( 'docs', [ fakeFile( 'guide.md', '# Guide\n' ), fakeFolder( 'deep', [ fakeFile( 'x.txt', 'x' ) ] ) ] ),
  fakeFolder( '.git', [ fakeFile( 'config', gitConfig ), fakeFile( 'HEAD', 'ref: refs/heads/main\n' ),
    fakeFile( 'index', 'binary' ), fakeFolder( 'objects', [ fakeFile( 'ab', 'x' ) ] ) ] ),
] );

const uploadedFile = ( path, text ) => Object.defineProperty( new File( [ text ], path.split( '/' ).pop() ), 'webkitRelativePath', { value: path } );

test( 'local: a folder handle keeps the source contract; .git stays out of the tree', async () => {
  const source = await Local.fromHandle( fakeClone() );
  await checkSourceContract( source, 'docs/guide.md' );
  assertEqual( source.folderName, 'pages' );
  assertEqual( ( await source.listTree() ).map( ( item ) => item.path ).sort(), [ 'README.md', 'docs', 'docs/deep', 'docs/deep/x.txt', 'docs/guide.md' ] );
  assertEqual( await Local.readGitRepo( source ), { owner: 'theo-armour', repo: 'pages', branch: 'main' } );
  assert( await source.readText( '.git/index' ).then( () => false, () => true ), 'only .git/config and HEAD are read' );
} );

test( 'local: the upload fallback gives the same source', async () => {
  const source = Local.fromFiles( [
    uploadedFile( 'pages/README.md', '# Pages\n' ),
    uploadedFile( 'pages/docs/deep/x.txt', 'x' ),
    uploadedFile( 'pages/.git/config', gitConfig ),
    uploadedFile( 'pages/.git/objects/ab', 'x' ),
  ] );
  await checkSourceContract( source, 'docs/deep/x.txt' );
  assertEqual( source.folderName, 'pages' );
  assertEqual( ( await source.listTree() ).map( ( item ) => item.path ).sort(), [ 'README.md', 'docs', 'docs/deep', 'docs/deep/x.txt' ] );
  assertEqual( await Local.readGitRepo( source ), { owner: 'theo-armour', repo: 'pages', branch: '' } );
} );

test( 'local: .git/config gives the GitHub repo', () => {
  const remote = ( name, url ) => `[remote "${ name }"]\n\turl = ${ url }\n`;
  assertEqual( Local.parseGitConfig( remote( 'origin', 'git@github.com:pushme-pullyou/tootoo.git' ) ), { owner: 'pushme-pullyou', repo: 'tootoo' } );
  assertEqual( Local.parseGitConfig( remote( 'origin', 'https://github.com/theo-armour/theo-armour.github.io' ) ),
    { owner: 'theo-armour', repo: 'theo-armour.github.io' } );
  assertEqual( Local.parseGitConfig( remote( 'origin', 'https://github.com/a/b.c.git/' ) ), { owner: 'a', repo: 'b.c' } );
  assertEqual( Local.parseGitConfig( remote( 'upstream', 'https://github.com/x/y' ) + remote( 'origin', 'https://github.com/a/b' ) ),
    { owner: 'a', repo: 'b' }, 'origin wins:' );
  assertEqual( Local.parseGitConfig( remote( 'origin', 'https://gitlab.com/a/b.git' ) ), null );
  assertEqual( Local.parseGitHead( 'ref: refs/heads/feature/x\n' ), 'feature/x' );
  assertEqual( Local.parseGitHead( '3f2a9c0e1b4d5a6f7e8d9c0b1a2f3e4d5c6b7a8f\n' ), '' );
} );

test( 'local: the picker when the browser has one, else the upload input', () => {
  assertEqual( Local.pickMethod( { showDirectoryPicker: () => {} } ), 'picker' );
  assertEqual( Local.pickMethod( {} ), 'upload' );
} );

test( 'local: IndexedDB answers or gives up within its time limit', async () => {
  // Headless Chrome on file:// never answers; a normal browser does. Either way, no hang.
  const started = Date.now();
  const outcome = await Local.idb( 'readonly', ( store ) => store.get( '/no/such/page.html' ) ).then( () => 'answered', () => 'gave up' );
  assert( Date.now() - started < 3000, `${ outcome } after ${ Date.now() - started } ms` );
} );

// From here on the local tests use an in-memory store, never a real page's memory.
const fakeDb = new Map();
Local.db = { get: async ( key ) => fakeDb.get( key ), put: async ( key, record ) => { fakeDb.set( key, record ); } };

test( 'local: each page path remembers its own choice', async () => {
  await Local.remember( { choice: 'github' }, '/repos/a/index.html' );
  await Local.remember( { choice: 'local', folderName: 'b' }, '/repos/b/index.html' );
  assertEqual( await Local.recall( '/repos/a/index.html' ), { choice: 'github' } );
  assertEqual( await Local.recall( '/repos/b/index.html' ), { choice: 'local', folderName: 'b' } );
  assertEqual( await Local.recall( '/repos/c/index.html' ), undefined );
  await Local.remember( { choice: 'local' } );
  assert( fakeDb.has( location.pathname ), 'the default key is this page\'s path' );
} );

// Runs the start panel in a hidden box and returns what's needed to drive it.
const startPanel = async ( win, saved ) => {
  await Local.remember( saved );   // keyed by this test page's path
  const box = document.createElement( 'div' );
  box.hidden = true;
  document.body.append( box );
  const result = Local.showStartPanel( box, win );
  await waitFor( () => box.querySelector( '.start-actions' ) && box.querySelector( '.start-actions' ).children.length );
  const labels = () => [ ...box.querySelector( '.start-actions' ).children ].map( ( node ) => node.textContent );
  const click = ( text ) => [ ...box.querySelectorAll( 'button' ) ].find( ( b ) => b.textContent.includes( text ) ).click();
  return { box, result, labels, click, done: () => box.remove() };
};

test( 'start panel: no picker → the upload input, then Browse GitHub', async () => {
  const panel = await startPanel( {}, {} );
  assertEqual( panel.labels(), [ '📤 Choose folder (upload)', 'Browse GitHub instead' ] );
  assert( panel.box.querySelector( 'input[type=file][webkitdirectory]' ), 'no folder-upload input' );
  assert( panel.box.querySelector( '.start-actions' ).firstChild.classList.contains( 'primary' ), 'first is not primary' );
  panel.done();
} );

test( 'start panel: a remembered GitHub choice comes first and is remembered again', async () => {
  const gitRepo = { owner: 'theo-armour', repo: 'pages', branch: 'main' };
  const panel = await startPanel( { showDirectoryPicker: () => {} },
    { choice: 'github', folderName: 'pages', handle: { name: 'pages' }, gitRepo } );
  assertEqual( panel.labels(), [ 'Browse theo-armour/pages on GitHub instead', '📂 Reopen pages', '📂 Open folder' ] );
  panel.click( 'on GitHub instead' );
  assertEqual( await panel.result, { choice: 'github', repo: gitRepo } );
  assertEqual( ( await Local.recall() ).choice, 'github' );
  panel.done();
} );

test( 'start panel: a picker that throws offers the upload input', async () => {
  const broken = { showDirectoryPicker: async () => { throw new DOMException( 'The user aborted a request.', 'AbortError' ); } };
  const panel = await startPanel( broken, {} );
  panel.click( 'Open folder' );
  await waitFor( () => panel.labels().includes( '📤 Choose folder (upload)' ) );
  assert( panel.box.querySelector( '.start-message' ).textContent.includes( 'upload' ), 'no message' );
  panel.done();
} );

test( 'start panel: a picked folder becomes the local source', async () => {
  const panel = await startPanel( { showDirectoryPicker: async () => fakeClone() }, {} );
  panel.click( 'Open folder' );
  const { choice, source } = await panel.result;
  assertEqual( choice, 'local' );
  assertEqual( source.folderName, 'pages' );
  assertEqual( await source.readText( 'README.md' ), '# Pages\n' );
  panel.done();
} );

// ── GitHub: canned responses, no network ──

const canned = ( status, body = {} ) => () => new Response( JSON.stringify( body ), { status } );

// Runs fn with GitHub's requests answered by `routes` ([ [ pattern, canned ], … ]) and a fake
// token store. fn gets the list of calls made.
const withFakeGitHub = async ( routes, fn, token = '' ) => {
  const saved = { request: GitHub.request, storage: GitHub.storage };
  const calls = [];
  const store = new Map( token ? [ [ GitHub.tokenKey(), token ] ] : [] );
  GitHub.storage = () => ( { getItem: ( k ) => store.get( k ) ?? null, setItem: ( k, v ) => store.set( k, v ), removeItem: ( k ) => store.delete( k ) } );
  GitHub.request = async ( url, options = {} ) => {
    calls.push( { url, options } );
    const route = routes.find( ( [ pattern ] ) => pattern.test( url ) );
    return route ? route[ 1 ]() : canned( 500 )();
  };
  Object.assign( state, { owner: 'o', repo: 'r', branch: '' } );
  try { return await fn( calls, store ); } finally { Object.assign( GitHub, saved ); GitHub.cache.clear(); }
};

const errorFrom = ( promise ) => promise.then( () => null, ( error ) => error );
const repoRoute = /\/repos\/o\/r$/;
const treeRoute = /\/git\/trees\//;

test( 'github: the tree, on the default branch, without submodules', () => withFakeGitHub( [
  [ repoRoute, canned( 200, { default_branch: 'main' } ) ],
  [ /\/git\/trees\/main\?recursive=1$/, canned( 200, { truncated: false, tree: [
    { path: 'docs', type: 'tree' }, { path: 'docs/a.md', type: 'blob', size: 3 }, { path: 'lib', type: 'commit' } ] } ) ],
], async () => {
  assertEqual( await GitHub.listTree(), [ { path: 'docs', type: 'folder', size: 0 }, { path: 'docs/a.md', type: 'file', size: 3 } ] );
  assertEqual( state.branch, 'main' );
} ) );

test( 'github: a rate limit or a refused token asks for a token', () => withFakeGitHub( [ [ repoRoute, canned( 403 ) ] ], async () => {
  const error = await errorFrom( GitHub.listTree() );
  assertEqual( [ error.kind, error.needsToken ], [ 'rate-limit', true ] );
  GitHub.request = async () => canned( 401 )();
  assertEqual( ( await errorFrom( GitHub.listTree() ) ).kind, 'bad-token' );
} ) );

test( 'github: a missing branch in a readable repo says so', () => withFakeGitHub( [
  [ treeRoute, canned( 404 ) ], [ repoRoute, canned( 200, { default_branch: 'main' } ) ],
], async () => {
  state.branch = 'nope';
  const error = await errorFrom( GitHub.listTree() );
  assertEqual( [ error.kind, error.needsToken ], [ 'missing-branch', false ] );
  assertEqual( error.message, 'Branch "nope" not found in o/r.' );
} ) );

test( 'github: a missing or private repo asks for a token', () => withFakeGitHub( [ [ /./, canned( 404 ) ] ], async () => {
  const error = await errorFrom( GitHub.listTree() );
  assertEqual( [ error.kind, error.needsToken ], [ 'private', true ] );
} ) );

test( 'github: a truncated tree gives the "too large" notice', () => withFakeGitHub( [
  [ treeRoute, canned( 200, { truncated: true, tree: [] } ) ],
], async () => {
  state.branch = 'main';
  const error = await errorFrom( GitHub.listTree() );
  assertEqual( error.kind, 'too-large' );
  assert( error.message.startsWith( 'o/r is over GitHub\'s limit' ), error.message );
} ) );

test( 'github: without a token, files come from raw and are cached', () => withFakeGitHub( [
  [ /^https:\/\/raw\.githubusercontent\.com\/o\/r\/main\/docs\/read%20me\.md$/, () => new Response( 'hello' ) ],
  [ /raw\.githubusercontent\.com/, canned( 404 ) ],
], async ( calls ) => {
  state.branch = 'main';
  assertEqual( await GitHub.readText( 'docs/read me.md' ), 'hello' );
  assertEqual( await GitHub.readText( 'docs/read me.md' ), 'hello' );
  assertEqual( calls.length, 1, 'the second read is cached:' );
  assertEqual( calls[ 0 ].options, {}, 'no headers, so no CORS preflight:' );
  assertEqual( await GitHub.fileUrl( 'a b.png' ), 'https://raw.githubusercontent.com/o/r/main/a%20b.png' );
  assertEqual( ( await errorFrom( GitHub.readText( 'gone.md' ) ) ).kind, 'not-found' );
} ) );

test( 'github: with a token, files come through the Contents API', () => withFakeGitHub( [
  [ /\/repos\/o\/r\/contents\/docs\/a\.md\?ref=main$/, () => new Response( 'private text' ) ],
], async ( calls ) => {
  state.branch = 'main';
  assertEqual( await GitHub.readText( 'docs/a.md' ), 'private text' );
  assertEqual( calls[ 0 ].options.headers.Authorization, 'token secret' );
  assertEqual( calls[ 0 ].options.headers.Accept, 'application/vnd.github.raw+json' );
}, 'secret' ) );

test( 'github: the token is saved, removed, and survives blocked storage', () => withFakeGitHub( [], async ( calls, store ) => {
  GitHub.setToken( 'abc' );
  assertEqual( store.get( 'tootoo:githubToken' ), 'abc' );
  GitHub.setToken( '' );
  assertEqual( GitHub.getToken(), '' );
  GitHub.storage = () => { throw new Error( 'storage blocked' ); };
  GitHub.setToken( 'x' );
  assertEqual( GitHub.getToken(), '' );
} ) );

test( 'github: which repo to show', () => {
  const none = { owner: '', repo: '', branch: '' };
  const config = { owner: 'theo-armour', repo: 'pages', branch: '' };
  assertEqual( GitHub.detectRepo( 'https://x.github.io/y/?owner=a&repo=b&branch=dev', config ), { owner: 'a', repo: 'b', branch: 'dev' } );
  assertEqual( GitHub.detectRepo( 'https://x.github.io/y/?owner=a', config ), { owner: 'theo-armour', repo: 'pages', branch: '' }, 'owner alone is not enough:' );
  assertEqual( GitHub.detectRepo( 'https://x.github.io/y/?branch=dev', config ), { owner: 'theo-armour', repo: 'pages', branch: 'dev' } );
  assertEqual( GitHub.detectRepo( 'https://theo-armour.github.io/sandbox/index.html', none ), { owner: 'theo-armour', repo: 'sandbox', branch: '' } );
  assertEqual( GitHub.detectRepo( 'https://theo-armour.github.io/index.html', none ), { owner: 'theo-armour', repo: 'theo-armour.github.io', branch: '' } );
  assertEqual( GitHub.detectRepo( 'file:///C:/repos/pages/index.html', none ), none );
} );
