// test-release.js: Stage 6, checks on the assembled file (SPEC.md §9, release checks).
// They run only with ?release=1, where the whole suite runs inside build/index.html.

if ( releaseMode ) {

  const buildText = async () => ( await fetch( location.href.split( '#' )[ 0 ] ) ).text();
  const count = ( text, part ) => text.split( part ).length - 1;

  test( 'release: the suite runs inside build/index.html, on its inlined code', () => {
    assert( location.pathname.endsWith( '/build/index.html' ), location.pathname );
    assert( ! document.querySelector( 'script[src^="core/"], script[src^="../src/"]' ), 'a script still loads from src/' );
  } );

  test( 'release: no <script src> or stylesheet link points into src/', async () => {
    const text = await buildText();
    const source = await ( await fetch( '../src/index.html' ) ).text();
    const local = [ ...source.matchAll( /<(?:script src|link rel="stylesheet" href)="(?!https?:|\/\/)([^"]+)"/g ) ].map( ( m ) => m[ 1 ] );
    assert( local.length >= 19, `found only ${ local.length } source files` );
    for ( const path of local ) {
      assert( ! text.includes( `<script src="${ path }"` ) && ! text.includes( `<link rel="stylesheet" href="${ path }"` ), `still points to ${ path }` );
    }
  } );

  test( 'release: exactly one release stamp, and each config marker exactly once', async () => {
    const text = await buildText();
    assertEqual( count( text, '<meta name="tootoo-release" content="' ), 1, 'stamps:' );
    assertEqual( [ count( text, 'TOOTOO-CONFIG-START' ), count( text, 'TOOTOO-CONFIG-END' ) ], [ 1, 1 ], 'START, END:' );
  } );

  test( 'release: a build date, a banner under the doctype and a description', async () => {
    const text = await buildText();
    assert( /^\d{4}-\d\d-\d\d$/.test( Shell.built() ), `built stamp: ${ Shell.built() }` );
    assertEqual( count( text, '<meta name="tootoo-built" content="' ), 1, 'built stamps:' );
    assert( text.startsWith( `<!doctype html>\n<!-- TooToo ${ Shell.release() }, built ${ Shell.built() }. ` ), text.slice( 0, 80 ) );
    assertEqual( count( text, '<meta name="description" content="' ), 1, 'descriptions:' );
    assert( Shell.aboutHtml().includes( ` · built ${ Shell.built() }` ) && Shell.aboutHtml().includes( 'about-description' ), 'About shows both' );
  } );

  test( 'release: the config block is the same as in src/index.html', async () => {
    const source = await ( await fetch( '../src/index.html' ) ).text();
    assertEqual( Update.blockOf( await buildText(), 'build' ).block, Update.blockOf( source, 'src' ).block );
  } );

}
