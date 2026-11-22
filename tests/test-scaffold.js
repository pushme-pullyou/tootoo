// test-scaffold.js: Stage 0 checks that the harness itself works.

test( 'the harness runs async tests', async () => {
  const value = await Promise.resolve( 2 );
  assertEqual( value, 2 );
} );

test( 'assertThrows checks the error message', () => {
  assertThrows( () => { throw new Error( 'missing marker' ); }, /marker/ );
} );

test( 'tests/index.html loads the same src/ scripts as src/index.html, in order', async () => {
  const html = await ( await fetch( '../src/index.html' ) ).text();
  const appScripts = [ ...html.matchAll( /<script src="(?!https?:|\/\/)([^"]+)"/g ) ].map( ( m ) => m[ 1 ] );
  const testScripts = [ ...document.querySelectorAll( 'script[src^="../src/"]' ) ]
    .map( ( script ) => script.getAttribute( 'src' ).slice( '../src/'.length ) );
  assertEqual( testScripts, appScripts );
} );

if ( releaseMode ) {
  test( 'build/index.html loads in a frame', async () => {
    const app = await openRelease();
    assertEqual( app.document.title, 'TooToo' );
    const stamp = app.document.querySelector( 'meta[name="tootoo-release"]' );
    assert( stamp && stamp.content, 'release stamp missing' );
  } );
}
