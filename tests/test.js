// test.js: a tiny test runner. Register with test( name, fn ), then call runTests().
// It lists each test green or red and ends with exactly one line "PASS n / FAIL n",
// which run-tests.ps1 reads from headless Chrome.

const Tests = { list: [], loadErrors: [] };

// A script that fails to load or throws while loading counts as a failure,
// so a broken file can never give a false "FAIL 0".
window.addEventListener( 'error', ( event ) => {
  Tests.loadErrors.push( event.message || `could not load ${ event.target.src || event.target.href }` );
}, true );

const test = ( name, fn ) => Tests.list.push( { name, fn } );

const assert = ( condition, message = 'assertion failed' ) => {
  if ( ! condition ) { throw new Error( message ); }
};

const assertEqual = ( actual, expected, message = '' ) => {
  const a = JSON.stringify( actual );
  const e = JSON.stringify( expected );
  assert( a === e, `${ message } expected ${ e }, got ${ a }`.trim() );
};

const assertThrows = ( fn, pattern ) => {
  try { fn(); } catch ( error ) {
    assert( ! pattern || pattern.test( error.message ), `error "${ error.message }" does not match ${ pattern }` );
    return;
  }
  throw new Error( `expected an error matching ${ pattern }` );
};

// Waits until check() is true, for UI that updates after a click.
const waitFor = async ( check, ms = 2000 ) => {
  const start = Date.now();
  while ( ! check() ) {
    if ( Date.now() - start > ms ) { throw new Error( `waitFor: still false after ${ ms } ms` ); }
    await new Promise( ( resolve ) => setTimeout( resolve, 10 ) );
  }
};

// Headless Chrome (--virtual-time-budget) treats a page waiting on a file or IndexedDB read
// as idle, and dumps it before the read finishes. A message loop keeps the page busy until
// the tests end. There is no per-test timeout (virtual time would fire it early): a test that
// never settles leaves no PASS / FAIL line, and run-tests.ps1 names the last test that finished.
const keepBusy = () => {
  const loop = { running: true, channel: new MessageChannel() };
  loop.channel.port1.onmessage = () => { if ( loop.running ) { loop.channel.port2.postMessage( 0 ); } };
  loop.channel.port2.postMessage( 0 );
  return () => { loop.running = false; };
};

// Each result is listed as soon as it's known, so a page that stalls shows where.
const runTests = async ( listElement, summaryElement ) => {
  const stopBusy = keepBusy();
  const escape = ( text ) => String( text ).replace( /&/g, '&amp;' ).replace( /</g, '&lt;' );
  const counts = { pass: 0, fail: 0 };
  const report = ( name, error ) => {
    counts[ error === undefined ? 'pass' : 'fail' ] += 1;
    listElement.insertAdjacentHTML( 'beforeend', error === undefined
      ? `<li class="pass">✔ ${ escape( name ) }</li>`
      : `<li class="fail">✘ ${ escape( name ) }: ${ escape( error ) }</li>` );
  };
  Tests.loadErrors.forEach( ( message ) => report( 'loading', message ) );
  for ( const { name, fn } of Tests.list ) {
    try { await fn(); report( name ); }
    catch ( error ) { report( name, ( error && error.message ) || String( error ) ); }
  }
  summaryElement.textContent = `PASS ${ counts.pass } / FAIL ${ counts.fail }`;
  stopBusy();
};
