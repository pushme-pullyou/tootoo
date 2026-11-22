// csv.js: CSV and TSV as a table (the first row is the header), with a Raw view.

const CsvLoader = {

  extensions: [ 'csv', 'tsv' ],
  toggle: () => true,
  maxRows: 2000,   // a bigger file shows its first rows and says so

  // Text → rows of cells. A quoted cell may hold the separator, line breaks, and "" for a quote.
  parse: ( text, separator = ',' ) => {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for ( let i = 0; i < text.length; i += 1 ) {
      const c = text[ i ];
      if ( quoted && c === '"' && text[ i + 1 ] === '"' ) { cell += '"'; i += 1; }
      else if ( quoted && c === '"' ) { quoted = false; }
      else if ( quoted ) { cell += c; }
      else if ( c === '"' && cell === '' ) { quoted = true; }
      else if ( c === separator ) { row.push( cell ); cell = ''; }
      else if ( c === '\n' ) { row.push( cell ); rows.push( row ); row = []; cell = ''; }
      else if ( c !== '\r' ) { cell += c; }
    }
    if ( cell || row.length ) { row.push( cell ); rows.push( row ); }
    return rows;
  },

  render: async ( file, element ) => {
    const rows = CsvLoader.parse( await file.source.readText( file.path ), file.ext === 'tsv' ? '\t' : ',' );
    const esc = Shell.escape;
    const cells = ( row, tag ) => row.map( ( cell ) => `<${ tag }>${ esc( cell ) }</${ tag }>` ).join( '' );
    const [ head = [], ...body ] = rows;
    const shown = body.slice( 0, CsvLoader.maxRows );
    const more = body.length > shown.length ? `<p class="message">Showing the first ${ shown.length.toLocaleString() } of ${ body.length.toLocaleString() } rows.</p>` : '';
    element.innerHTML = `<div class="table-view"><table>
      <thead><tr>${ cells( head, 'th' ) }</tr></thead>
      <tbody>${ shown.map( ( row ) => `<tr>${ cells( row, 'td' ) }</tr>` ).join( '' ) }</tbody>
    </table></div>${ more }`;
  },

};
