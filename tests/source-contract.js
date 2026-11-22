// source-contract.js: checks that a source keeps the four-function contract (SPEC.md §4).
// The suite runs it on the mock and the local source; live.html (Stage 6) runs it on GitHub.
//   textFile: a text file the source has. missingFile: one it doesn't.

const checkSourceContract = async ( source, textFile, missingFile = 'no/such/file.txt' ) => {
  for ( const name of [ 'listTree', 'readText', 'readBlob', 'fileUrl' ] ) {
    assert( typeof source[ name ] === 'function', `${ name } is missing` );
  }

  const tree = await source.listTree();
  assert( Array.isArray( tree ) && tree.length > 0, 'listTree gave no items' );
  const paths = new Set( tree.map( ( item ) => item.path ) );
  assertEqual( paths.size, tree.length, 'paths are unique:' );
  for ( const item of tree ) {
    assert( typeof item.path === 'string' && item.path && ! /^\/|\/$/.test( item.path ), `bad path "${ item.path }"` );
    assert( item.type === 'file' || item.type === 'folder', `${ item.path }: bad type "${ item.type }"` );
    assert( Number.isFinite( item.size ), `${ item.path }: size is not a number` );
    const parent = item.path.split( '/' ).slice( 0, -1 ).join( '/' );
    assert( ! parent || paths.has( parent ), `${ item.path }: parent folder "${ parent }" is not listed` );
  }

  const text = await source.readText( textFile );
  assert( typeof text === 'string' && text.length > 0, 'readText gave no text' );
  const blob = await source.readBlob( textFile );
  assert( blob && typeof blob.arrayBuffer === 'function', 'readBlob did not give a Blob' );
  assertEqual( await blob.text(), text, 'readBlob and readText agree:' );
  assertEqual( blob.size, tree.find( ( item ) => item.path === textFile ).size, 'the tree size matches:' );

  const url = await source.fileUrl( textFile );
  assert( /^(https?|blob|file):/.test( url ), `fileUrl gave "${ url }"` );

  const missing = await source.readText( missingFile ).then( () => 'read', ( error ) => error );
  assert( missing instanceof Error || ( missing && missing.message ), 'reading a missing file should fail' );
};
