// test-update.js: Stage 5, the update check and the config-block swap (no network, fake clock).

const latestR3 = { release: 'r3', date: '2026-12-01', url: 'https://example.test/releases/r3/index.html', notes: 'https://example.test/notes/r3' };

// Runs fn with Update's storage, requests, clock, release and maintainer rule faked.
// fn gets { calls, clock }: the URLs requested, and a clock to move ({ now } in ms).
const withFakeUpdate = async ( { release = 'r2', maintainer = true, answer = () => new Response( JSON.stringify( latestR3 ) ) }, fn ) => {
  const saved = [ 'storage', 'request', 'clock', 'release', 'isMaintainer', 'ownSource', 'save' ].reduce( ( all, key ) => ( { ...all, [ key ]: Update[ key ] } ), {} );
  const store = new Map();
  const calls = [];
  const clock = { now: 0 };
  Object.assign( Update, {
    storage: () => ( { getItem: ( key ) => store.get( key ) ?? null, setItem: ( key, value ) => store.set( key, value ) } ),
    request: async ( url ) => { calls.push( url ); return answer( url ); },
    clock: () => clock.now,
    release: () => release,
    isMaintainer: () => maintainer,
  } );
  state.latest = null;
  try { return await fn( { calls, clock } ); } finally { Object.assign( Update, saved ); state.latest = null; }
};

// ── The check ──

test( 'update: release numbers compare as numbers, so r9 < r10', () => {
  assertEqual( [ Update.isNewer( 'r10', 'r9' ), Update.isNewer( 'r9', 'r10' ), Update.isNewer( 'r2', 'r2' ) ], [ true, false, false ] );
  assertEqual( [ Update.number( 'r12' ), Update.number( 'dev' ), Update.number( '' ) ], [ 12, 0, 0 ] );
} );

test( 'update: only likely maintainers are told (file://, or a saved token)', () => {
  assertEqual( [ Update.isMaintainer( 'file:', '' ), Update.isMaintainer( 'https:', '' ), Update.isMaintainer( 'https:', 'token' ) ], [ true, false, true ] );
} );

test( 'update: checks at most once a day, and remembers the answer', () => withFakeUpdate( {}, async ( { calls, clock } ) => {
  const seen = [];
  const listener = ( latest ) => seen.push( latest.release );
  Events.on( 'update-available', listener );
  const first = await Update.check();
  clock.now = Update.DAY - 1;
  const sameDay = await Update.check();
  clock.now = Update.DAY;
  await Update.check();
  Events.off( 'update-available', listener );
  assertEqual( [ first.release, sameDay.release ], [ 'r3', 'r3' ] );
  assertEqual( calls.length, 2, 'fetched on the first load and a day later only:' );
  assertEqual( calls[ 0 ], CONFIG.updateUrl );
  assertEqual( seen, [ 'r3', 'r3', 'r3' ] );
  assertEqual( state.release, 'r2' );
} ) );

test( 'update: nothing for the dev page, a reader, checkForUpdates off, or the same release', async () => {
  const quiet = async ( options, config = CONFIG ) => withFakeUpdate( options, async ( { calls } ) => [ await Update.check( config ), calls.length ] );
  assertEqual( await quiet( { release: 'dev' } ), [ null, 0 ] );
  assertEqual( await quiet( { maintainer: false } ), [ null, 0 ] );
  assertEqual( await quiet( {}, { ...CONFIG, checkForUpdates: false } ), [ null, 0 ] );
  assertEqual( await quiet( { release: 'r3' } ), [ null, 1 ] );
} );

test( 'update: failures are silent', async () => {
  const failing = async ( answer ) => withFakeUpdate( { answer }, () => Update.check() );
  assertEqual( await failing( () => { throw new TypeError( 'Failed to fetch' ); } ), null );
  assertEqual( await failing( () => new Response( 'Not found', { status: 404 } ) ), null );
  assertEqual( await failing( () => new Response( '{ "release": "nonsense" }' ) ), null );
} );

// ── The swap ──

const block = ( settings ) => `<!-- TOOTOO-CONFIG-START: your settings. Updates carry this block forward unchanged. -->\r\n<script>\r\n`
  + `window.TOOTOO_CONFIG = {\r\n${ settings }\r\n};\r\n</script>\r\n<!-- TOOTOO-CONFIG-END -->`;
const page = ( release, settings, body ) => `<!doctype html>\r\n<head>\r\n<meta name="tootoo-release" content="${ release }">\r\n${ block( settings ) }\r\n</head>\r\n<body>${ body }</body>\r\n`;

test( 'update: the swap keeps this page\'s block byte for byte', () => {
  const ownSettings = "  owner: 'theo-armour', // mine\r\n  faviconLetters: 'SB',    // a retired key\r\n  subtitle: 'Café ☕ 日本語 — “quoted”',\r\n  subtitle: 'twice',";
  const own = page( 'r2', ownSettings, 'old body' );
  const fresh = page( 'r3', "  // owner: '',", 'new body' );
  const merged = Update.swap( fresh, own );
  assertEqual( merged, page( 'r3', ownSettings, 'new body' ) );
  assert( merged.includes( block( ownSettings ) ), 'the block is unchanged' );
  assert( ! merged.includes( 'old body' ) && merged.includes( 'content="r3"' ), 'everything else is the new release' );
} );

test( 'update: a missing or doubled marker is a clear error', () => {
  const good = page( 'r3', '', '' );
  assertThrows( () => Update.swap( good, '<html>no block</html>' ), /This page needs each config marker exactly once; found START 0/ );
  assertThrows( () => Update.swap( good + block( '' ), good ), /The new release needs each config marker exactly once; found START 2/ );
  assertThrows( () => Update.swap( good.replace( '<!-- TOOTOO-CONFIG-END -->', '' ), good ), /END 0/ );
  const backwards = '<!-- TOOTOO-CONFIG-END --> … <!-- TOOTOO-CONFIG-START: x -->';
  assertThrows( () => Update.swap( good, backwards ), /END marker comes before START/ );
} );

test( 'update: src/index.html has one block, and swapping it into itself changes nothing', async () => {
  const text = await ( await fetch( '../src/index.html' ) ).text();
  assertEqual( Update.swap( text, text ), text );
  assert( Update.blockOf( text, 'src/index.html' ).block.includes( 'window.TOOTOO_CONFIG' ), 'the block holds the config' );
} );

test( 'update: the block rebuilt from the DOM matches the source (with LF line ends)', () => {
  const settings = "  owner: 'a', // note\n  appName: 'Pages'";
  const lfBlock = block( settings ).replace( /\r\n/g, '\n' );
  const doc = new DOMParser().parseFromString( `<!doctype html><html><head><title>x</title>\n${ lfBlock }\n<script>other()</script></head><body></body></html>`, 'text/html' );
  assertEqual( Update.blockFromDom( doc ), lfBlock );
  assertEqual( Update.blockFromDom( new DOMParser().parseFromString( '<p>no block</p>', 'text/html' ) ), '' );
} );

// ── The notice and the download ──

test( 'update: the notice offers the download, and the download carries the block', () => withFakeUpdate( {
  answer: () => new Response( page( 'r3', "  // owner: '',", 'new body' ) ),
}, async ( { calls } ) => {
  const own = page( 'r2', "  owner: 'theo-armour',", 'old body' );
  const saved = [];
  Update.ownSource = async () => own;
  Update.save = ( blob, name ) => saved.push( { blob, name } );
  const notice = document.createElement( 'section' );
  notice.hidden = true;
  const unmount = Update.mount( notice );
  state.latest = latestR3;
  Events.emit( 'update-available', latestR3 );
  assert( ! notice.hidden && notice.textContent.includes( 'TooToo r3 available' ), notice.textContent );
  assertEqual( notice.querySelector( 'a' ).href, latestR3.notes );
  notice.querySelector( '[data-action=download-update]' ).click();
  await waitFor( () => saved.length );
  assertEqual( calls.includes( latestR3.url ), true );
  assertEqual( saved[ 0 ].name, 'index.html' );
  assertEqual( await saved[ 0 ].blob.text(), page( 'r3', "  owner: 'theo-armour',", 'new body' ) );

  // A page without a block can't be swapped: the notice says how to do it by hand.
  Update.ownSource = async () => '<html>no block</html>';
  notice.querySelector( '[data-action=download-update]' ).click();
  await waitFor( () => notice.textContent.includes( 'by hand' ) );
  unmount();
} ) );
