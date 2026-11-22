// test-core.js: Stage 1, config merge, events and the router.

// ── Config ──

test( 'config: no block gives the defaults', () => {
  assertEqual( Config.merge( undefined ), Config.defaults );
  assertEqual( CONFIG, Config.defaults, 'this page has no block, so' );
} );

test( 'config: a key in the block overrides its default', () => {
  const settings = Config.merge( { appName: 'Pages', hiddenFolders: [ 'Images' ] } );
  assertEqual( settings.appName, 'Pages' );
  assertEqual( settings.hiddenFolders, [ 'Images' ] );
  assertEqual( settings.view, 'browser', 'other keys keep their defaults:' );
} );

test( 'config: an undefined value uses the default', () => {
  assertEqual( Config.merge( { storagePrefix: undefined } ).storagePrefix, 'tootoo' );
} );

test( 'config: unknown keys are ignored and listed', () => {
  const block = { owner: 'theo-armour', faviconLetters: 'SB', toString: 'x' };
  const settings = Config.merge( block );
  assert( ! Object.hasOwn( settings, 'faviconLetters' ), 'faviconLetters should be ignored' );
  assertEqual( settings.owner, 'theo-armour' );
  assertEqual( Config.unknownKeys( block ), [ 'faviconLetters', 'toString' ] );
  assertEqual( Config.unknownKeys( undefined ), [] );
} );

test( 'config: a duplicated key, as pasted from the sandbox, keeps the last value', () => {
  // theo-armour-sandbox's tootoo.config.js, pasted as-is (two retired keys, subtitle twice).
  const block = {
    owner: 'theo-armour', repo: 'sandbox', appName: 'Sandbox', storagePrefix: 'ta-sandbox',
    themeColor: '#d4ac0d', subtitle: '', faviconLetters: 'SB', faviconColor: '#d4ac0d',
    subtitle: 'a GitHub repository browser', // eslint-disable-line no-dupe-keys
    hiddenFiles: [ 'tootoo.config.js' ], hiddenFolders: [ 'Images' ],
  };
  const settings = Config.merge( block );
  assertEqual( settings.subtitle, 'a GitHub repository browser' );
  assertEqual( settings.themeColor, '#d4ac0d' );
  assertEqual( Config.unknownKeys( block ), [ 'faviconLetters', 'faviconColor' ] );
} );

test( 'config: CONFIG and its arrays are frozen; the block itself is left alone', () => {
  assert( Object.isFrozen( CONFIG ), 'CONFIG is not frozen' );
  assert( Object.isFrozen( CONFIG.hiddenFiles ), 'CONFIG.hiddenFiles is not frozen' );
  const folders = [ 'Images' ];
  const settings = Config.merge( { hiddenFolders: folders } );
  assert( Object.isFrozen( settings.hiddenFolders ), 'merged array is not frozen' );
  assert( ! Object.isFrozen( folders ), 'the block\'s own array was frozen' );
} );

// ── Events ──

test( 'events: listeners run in the order they were added, with the detail', () => {
  const calls = [];
  const first = ( detail ) => calls.push( [ 'first', detail ] );
  const second = ( detail ) => calls.push( [ 'second', detail ] );
  Events.on( 'tree-loaded', first );
  Events.on( 'tree-loaded', second );
  Events.emit( 'tree-loaded', 7 );
  Events.off( 'tree-loaded', first );
  Events.off( 'tree-loaded', second );
  assertEqual( calls, [ [ 'first', 7 ], [ 'second', 7 ] ] );
} );

test( 'events: off removes only that listener', () => {
  const calls = [];
  const a = () => calls.push( 'a' );
  const b = () => calls.push( 'b' );
  Events.on( 'theme-changed', a );
  Events.on( 'theme-changed', b );
  Events.off( 'theme-changed', a );
  Events.emit( 'theme-changed' );
  Events.off( 'theme-changed', b );
  Events.emit( 'theme-changed' );
  assertEqual( calls, [ 'b' ] );
} );

test( 'events: a failing listener does not stop the next one', () => {
  const calls = [];
  const broken = () => { throw new Error( 'deliberate test error, logged by Events.emit' ); };
  const fine = () => calls.push( 'fine' );
  Events.on( 'file-rendered', broken );
  Events.on( 'file-rendered', fine );
  Events.emit( 'file-rendered' );
  Events.off( 'file-rendered', broken );
  Events.off( 'file-rendered', fine );
  assertEqual( calls, [ 'fine' ] );
} );

test( 'events: an unknown event name throws', () => {
  assertThrows( () => Events.emit( 'file-selcted' ), /Unknown event "file-selcted"/ );
  assertThrows( () => Events.on( 'nope', () => {} ), /Unknown event/ );
} );

// ── Router ──

const routerBase = 'file:///C:/repos/pages/index.html';

test( 'router: no params and no hash give empty parts', () => {
  assertEqual( Router.parse( routerBase ), { owner: '', repo: '', branch: '', path: '', heading: '' } );
  assertEqual( Router.build( {}, routerBase ), routerBase );
} );

test( 'router: parses the repo, the file and the heading', () => {
  const href = 'https://x.github.io/?owner=theo-armour&repo=pages&branch=main#docs/read%20me.md#getting-started';
  assertEqual( Router.parse( href ),
    { owner: 'theo-armour', repo: 'pages', branch: 'main', path: 'docs/read me.md', heading: 'getting-started' } );
} );

test( 'router: build → parse round-trips awkward paths and headings', () => {
  const cases = [
    { owner: 'theo-armour', repo: 'pages', branch: '', path: 'README.md', heading: '' },
    { owner: 'a', repo: 'b', branch: 'gh-pages', path: 'blog/2026-11/notes on #3 & 50%.md', heading: 'part 2: why?' },
    { owner: '', repo: '', branch: '', path: 'café/naïve – résumé.md', heading: 'Überblick' },
    { owner: '', repo: '', branch: '', path: 'a/b/c/d.js', heading: '' },
    { owner: '', repo: '', branch: '', path: '', heading: 'top' },
  ];
  for ( const parts of cases ) {
    assertEqual( Router.parse( Router.build( parts, routerBase ) ), parts, `for ${ parts.path }:` );
  }
} );

test( 'router: build keeps the hash readable and other params intact', () => {
  assertEqual( Router.build( { path: 'docs/read me.md', heading: 'intro' }, routerBase ), `${ routerBase }#docs/read%20me.md#intro` );
  const built = Router.build( { owner: 'a', repo: 'b' }, `${ routerBase }?source=mock&owner=old#old.md` );
  assertEqual( built, `${ routerBase }?source=mock&owner=a&repo=b` );
} );

test( 'router: a broken escape in the hash is kept as text', () => {
  assertEqual( Router.parse( `${ routerBase }#a%E0%A4%A.md` ).path, 'a%E0%A4%A.md' );
} );

test( 'router: setRepo writes the repo fields and emits repo-changed', () => {
  const seen = [];
  const listener = ( detail ) => seen.push( detail );
  Events.on( 'repo-changed', listener );
  Router.setRepo( { owner: 'theo-armour', repo: 'pages', branch: 'main' } );
  Events.off( 'repo-changed', listener );
  assertEqual( [ state.owner, state.repo, state.branch ], [ 'theo-armour', 'pages', 'main' ] );
  assertEqual( seen, [ { owner: 'theo-armour', repo: 'pages', branch: 'main' } ] );
} );

test( 'router: start sets the given repo and emits repo-changed', () => {
  const seen = [];
  const listener = ( detail ) => seen.push( detail );
  Events.on( 'repo-changed', listener );
  Router.start( { owner: 'a', repo: 'b', branch: '' } );
  Events.off( 'repo-changed', listener );
  assertEqual( seen, [ { owner: 'a', repo: 'b', branch: '' } ] );
} );

test( 'router: a hash change asks to open that file', async () => {
  const requested = new Promise( ( resolve ) => {
    const listener = ( detail ) => { Events.off( 'open-requested', listener ); resolve( detail ); };
    Events.on( 'open-requested', listener );
  } );
  location.hash = 'docs/read%20me.md#intro';
  const detail = await requested;
  history.replaceState( null, '', location.pathname + location.search );   // tidy up, without another hashchange
  assertEqual( detail, { path: 'docs/read me.md', heading: 'intro' } );
} );
