// test-scaffold.js: Stage 0 checks that the harness itself works.

test( 'the harness runs async tests', async () => {
  const value = await Promise.resolve( 2 );
  assertEqual( value, 2 );
} );

test( 'assertThrows checks the error message', () => {
  assertThrows( () => { throw new Error( 'missing marker' ); }, /marker/ );
} );

if ( ! releaseMode ) {
  test( 'tests/index.html loads the same src/ scripts as src/index.html, in order', async () => {
    const html = await ( await fetch( '../src/index.html' ) ).text();
    const inApp = [ ...html.matchAll( /<script src="(?!https?:|\/\/)([^"]+)"/g ) ].map( ( m ) => `../src/${ m[ 1 ] }` );
    assertEqual( appScripts, inApp );
  } );
}
