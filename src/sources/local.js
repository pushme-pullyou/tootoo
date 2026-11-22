// local.js: the local source. The same four functions over a folder on disk (decision 10):
//   - the File System Access picker (Chrome, Edge), whose folder can be reopened next visit;
//   - or, when the picker is missing or fails, <input type="file" webkitdirectory>: same tree, no memory.
//
// Also the file:// start panel (decision 32): Reopen <folder> / Open folder / Browse GitHub instead.
// The folder handle and the choice are saved in IndexedDB, keyed by the page's path,
// because every file:// page shares one IndexedDB.

const Local = {

  // ── A source from a list of entries: path → { type, size, getFile } ──

  // .git is never shown in the tree; only .git/config and .git/HEAD are read, to find the repo.
  isGitPath: ( path ) => path === '.git' || path.startsWith( '.git/' ),

  makeSource: ( folderName, entries ) => {
    const fileAt = async ( path ) => {
      const entry = entries.get( path );
      if ( ! entry || entry.type !== 'file' ) { throw Object.assign( new Error( `Not found: ${ path }` ), { kind: 'not-found' } ); }
      return entry.getFile();
    };
    return {
      name: 'local',
      folderName,
      listTree: async () => [ ...entries ]
        .filter( ( [ path ] ) => ! Local.isGitPath( path ) )
        .map( ( [ path, entry ] ) => ( { path, type: entry.type, size: entry.size || 0 } ) ),
      readText: async ( path ) => ( await fileAt( path ) ).text(),
      readBlob: fileAt,   // a File is a Blob, with its type already set
      fileUrl: async ( path ) => URL.createObjectURL( await fileAt( path ) ),
    };
  },

  // Walks a folder handle. Inside .git it keeps only config and HEAD, and doesn't go deeper.
  walk: async ( folder, prefix, entries ) => {
    for await ( const handle of folder.values() ) {
      const path = prefix + handle.name;
      const inGit = prefix === '.git/';
      if ( handle.kind === 'directory' && ! inGit ) {
        entries.set( path, { type: 'folder' } );
        await Local.walk( handle, `${ path }/`, entries );
      } else if ( handle.kind === 'file' && ( ! inGit || [ 'config', 'HEAD' ].includes( handle.name ) ) ) {
        const file = await handle.getFile();
        entries.set( path, { type: 'file', size: file.size, getFile: () => handle.getFile() } );   // fresh on each read
      }
    }
    return entries;
  },

  fromHandle: async ( folder ) => Local.makeSource( folder.name, await Local.walk( folder, '', new Map() ) ),

  // From the upload input: each file's webkitRelativePath starts with the folder's own name.
  fromFiles: ( files ) => {
    const entries = new Map();
    let folderName = '';
    for ( const file of files ) {
      const [ top, ...rest ] = file.webkitRelativePath.split( '/' );
      folderName = top;
      rest.slice( 0, -1 ).forEach( ( name, i ) => entries.set( rest.slice( 0, i + 1 ).join( '/' ), { type: 'folder' } ) );
      entries.set( rest.join( '/' ), { type: 'file', size: file.size, getFile: async () => file } );
    }
    return Local.makeSource( folderName, entries );
  },

  // ── Which GitHub repo the folder is a clone of ──

  // The [remote "origin"] url (https or ssh, optional .git), else any GitHub url. null if none.
  parseGitConfig: ( text ) => {
    const origin = text.match( /\[remote "origin"\]([^[]*)/ );
    const match = ( origin ? origin[ 1 ] : text ).match( /url\s*=\s*\S*github\.com[:/]+([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?\s*$/im );
    return match ? { owner: match[ 1 ], repo: match[ 2 ] } : null;
  },

  // 'ref: refs/heads/main' → 'main'. A detached HEAD gives '' (the default branch).
  parseGitHead: ( text ) => ( text.trim().match( /^ref: refs\/heads\/(.+)$/ ) || [] )[ 1 ] || '',

  readGitRepo: async ( source ) => {
    try {
      const repo = Local.parseGitConfig( await source.readText( '.git/config' ) );
      const head = await source.readText( '.git/HEAD' ).catch( () => '' );
      return repo ? { ...repo, branch: Local.parseGitHead( head ) } : null;
    } catch ( error ) { return null; }
  },

  // ── Remembered per page path, in IndexedDB: { choice: 'local' | 'github', handle, folderName, gitRepo } ──

  // One IndexedDB call. Storage can be blocked, or never answer at all (headless Chrome on
  // file://), so each call gives up after 2 s: the panel still appears, just without memory.
  idb: ( mode, action ) => new Promise( ( resolve, reject ) => {
    setTimeout( () => reject( new Error( 'IndexedDB did not answer' ) ), 2000 );
    const open = indexedDB.open( 'tootoo', 1 );
    open.onupgradeneeded = () => open.result.createObjectStore( 'pages' );
    open.onerror = () => reject( open.error );
    open.onsuccess = () => {
      const db = open.result;
      const request = action( db.transaction( 'pages', mode ).objectStore( 'pages' ) );
      request.onsuccess = () => { db.close(); resolve( request.result ); };
      request.onerror = () => { db.close(); reject( request.error ); };
    };
  } ),

  db: {   // tests swap in an in-memory store
    get: ( key ) => Local.idb( 'readonly', ( store ) => store.get( key ) ),
    put: ( key, record ) => Local.idb( 'readwrite', ( store ) => store.put( record, key ) ),
  },

  // When storage fails, nothing is remembered, and nothing breaks.
  recall: ( key = location.pathname ) => Local.db.get( key ).catch( () => null ),
  remember: ( record, key = location.pathname ) => Local.db.put( key, record ).catch( () => null ),

  // ── The start panel ──

  // 'picker' where the browser has one, else 'upload'.
  pickMethod: ( win = window ) => typeof win.showDirectoryPicker === 'function' ? 'picker' : 'upload',

  button: ( label, onClick ) => {
    const button = document.createElement( 'button' );
    button.type = 'button';
    button.textContent = label;
    button.addEventListener( 'click', onClick );
    return button;
  },

  // Shows the panel in `element` and resolves to { choice: 'local', source } or
  // { choice: 'github', repo } (repo is null when the folder's .git/config gave none).
  showStartPanel: async ( element, win = window ) => {
    const saved = ( await Local.recall() ) || {};
    element.innerHTML = `<section class="start-panel">
      <h2>📂 Open this repo from disk?</h2>
      <p>Choose the folder to browse its files, including edits not yet pushed. Nothing is fetched from GitHub until you choose.</p>
      <div class="start-actions"></div>
      <p class="start-message" role="status"></p>
    </section>`;
    const actions = element.querySelector( '.start-actions' );
    const message = element.querySelector( '.start-message' );

    return new Promise( ( resolve ) => {
      const openLocal = async ( source, handle ) => {
        const gitRepo = await Local.readGitRepo( source );
        const record = handle ? { choice: 'local', handle, folderName: source.folderName, gitRepo }
          : { ...saved, choice: 'local', gitRepo: gitRepo || saved.gitRepo };
        await Local.remember( record );
        resolve( { choice: 'local', source } );
      };

      // The fallback: a label around the hidden input, so the click opens the browser's folder upload.
      const upload = document.createElement( 'label' );
      upload.className = 'button';
      upload.innerHTML = '📤 Choose folder (upload)<input type="file" webkitdirectory hidden>';
      upload.querySelector( 'input' ).addEventListener( 'change', ( event ) => {
        if ( event.target.files.length ) { openLocal( Local.fromFiles( event.target.files ) ); }
      } );

      const showUpload = ( text ) => {
        message.textContent = text;
        if ( ! upload.isConnected ) { actions.prepend( upload ); }
      };

      const reopen = Local.button( `📂 Reopen ${ saved.folderName }`, async () => {
        try {
          const handle = saved.handle;
          const allowed = ( await handle.queryPermission( { mode: 'read' } ) ) === 'granted'
            || ( await handle.requestPermission( { mode: 'read' } ) ) === 'granted';
          if ( ! allowed ) { message.textContent = 'Permission not given. Try again, or open another folder.'; return; }
          openLocal( await Local.fromHandle( handle ), handle );
        } catch ( error ) {
          message.textContent = `Couldn't reopen ${ saved.folderName } (${ error.message }). Open the folder again.`;
        }
      } );

      const pick = Local.button( '📂 Open folder', async () => {
        try {
          const handle = await win.showDirectoryPicker( { mode: 'read' } );
          message.textContent = `Reading ${ handle.name }…`;
          openLocal( await Local.fromHandle( handle ), handle );
        } catch ( error ) {
          // A cancel and a broken picker (Chrome 157) both throw AbortError, so offer the fallback either way.
          showUpload( 'No folder opened. Try again, or choose the folder with the upload button.' );
        }
      } );

      const repo = saved.gitRepo;
      const github = Local.button( repo ? `Browse ${ repo.owner }/${ repo.repo } on GitHub instead` : 'Browse GitHub instead', async () => {
        await Local.remember( { ...saved, choice: 'github' } );
        resolve( { choice: 'github', repo: repo || null } );
      } );

      const local = [ saved.handle && saved.folderName ? reopen : null, Local.pickMethod( win ) === 'picker' ? pick : upload ];
      const ordered = saved.choice === 'github' ? [ github, ...local ] : [ ...local, github ];
      actions.append( ...ordered.filter( Boolean ) );
      ordered.filter( Boolean )[ 0 ].classList.add( 'primary' );   // the remembered choice comes first
    } );
  },

};
