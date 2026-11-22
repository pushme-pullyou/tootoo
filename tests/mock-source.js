// mock-source.js: the four-function source contract (SPEC.md §4) over an in-memory tree,
// with a sample of every file type and every tree rule. No network, no quota.

const MockSource = {

  name: 'mock',

  // path → text, or { text | base64, type } for files that need a MIME type.
  files: {
    'README.md': '# Mock repo\n\nA repo for the tests.\n\n## Getting started\n\nOpen a file.\n\n## Details\n\nSee [the guide](docs/guide.md).\n',
    'notes-2026-11-21-08-30.md': '# Notes (a dated backup)\n',
    'index.bak': '<!doctype html><title>the previous index.html</title>\n',
    'notes.txt': 'Plain text.\nSecond line.\n',
    'docs/README.md': '# Docs\n\nThe docs folder\'s own README.\n',
    'docs/guide.md': '# Guide\n\n## Install\n\nNothing to install.\n',
    'docs/paper.pdf': { text: '%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 obj >>\n%%EOF\n', type: 'application/pdf' },
    'blog/2025/2025-12-01-last-year.md': '# Last year\n',
    'blog/06-June/2026-06-28-summer.md': '# Summer\n',
    'blog/11-November/2026-11-02-first.md': '# First of November\n',
    'blog/11-November/2026-11-20-latest.md': '# Latest post\n',
    'code/app.js': 'const greet = ( name ) => `Hello, ${ name }`;\nconsole.log( greet( \'mock\' ) );\n',
    'data/table.csv': 'name,count\napples,3\npears,5\n',
    'data/sample.bin': { base64: 'AAEC/w==', type: 'application/octet-stream' },
    'media/pixel.png': { base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', type: 'image/png' },
    'media/clip.mp4': { base64: 'AAAAGGZ0eXBtcDQyAAAAAG1wNDJpc29t', type: 'video/mp4' },
    'media/logo.svg': { text: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><circle cx="5" cy="5" r="4"/></svg>\n', type: 'image/svg+xml' },
    'pages/demo.html': { text: '<!doctype html><title>Demo</title><h1>Demo page</h1>\n', type: 'text/html' },
    'Images/hidden-by-config.png': { base64: 'iVBORw0KGgo=', type: 'image/png' },
    '.github/workflows/pages.yml': 'name: Pages\n',
  },

  blobOf: ( path ) => {
    const entry = MockSource.files[ path ];
    if ( entry === undefined ) { throw Object.assign( new Error( `Not found: ${ path }` ), { kind: 'not-found' } ); }
    if ( typeof entry === 'string' ) { return new Blob( [ entry ], { type: 'text/plain' } ); }
    if ( entry.text !== undefined ) { return new Blob( [ entry.text ], { type: entry.type } ); }
    return new Blob( [ Uint8Array.from( atob( entry.base64 ), ( c ) => c.charCodeAt( 0 ) ) ], { type: entry.type } );
  },

  // Files, plus a folder entry for every parent folder.
  listTree: async () => {
    const tree = new Map();
    for ( const path of Object.keys( MockSource.files ) ) {
      const parts = path.split( '/' );
      parts.slice( 0, -1 ).forEach( ( part, i ) => tree.set( parts.slice( 0, i + 1 ).join( '/' ), { type: 'folder', size: 0 } ) );
      tree.set( path, { type: 'file', size: MockSource.blobOf( path ).size } );
    }
    return [ ...tree ].map( ( [ path, item ] ) => ( { path, ...item } ) );
  },

  readText: async ( path ) => MockSource.blobOf( path ).text(),
  readBlob: async ( path ) => MockSource.blobOf( path ),
  fileUrl: async ( path ) => URL.createObjectURL( MockSource.blobOf( path ) ),

};
