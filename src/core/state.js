// state.js: the one shared state object, plus a tiny on / off / emit.
//
// One writer per field. Only the owner changes a field; every other part reads it
// and listens for the owner's event.
//
//   Field                          Owner                        Event
//   owner, repo, branch            router.js / sources/*        repo-changed
//   source, tree                   the view (views/*), which picks the source and asks it for the tree
//                                                               tree-loaded
//   currentPath                    content.js                   file-selected, file-rendered
//   release, latest                update.js                    update-available
//
// Also: theme-changed (shell.js), and open-requested (router.js: the hash asks for a file;
// content.js opens it and then owns currentPath).

const state = {
  source: null,     // the active source: { listTree, readText, readBlob, fileUrl }
  owner: '',
  repo: '',
  branch: '',
  tree: null,       // [ { path, type: 'file' | 'folder', size } ]
  currentPath: '',
  release: '',      // this page's tootoo-release stamp
  latest: null,     // the newest release found by the update check
};

const Events = {

  // Every event name, so a typo throws instead of failing silently.
  names: [ 'repo-changed', 'tree-loaded', 'file-selected', 'file-rendered',
    'theme-changed', 'update-available', 'open-requested' ],

  listeners: {},    // event name → [ fn, … ] in the order they were added

  check: ( event ) => {
    if ( ! Events.names.includes( event ) ) { throw new Error( `Unknown event "${ event }"` ); }
  },

  on: ( event, fn ) => {
    Events.check( event );
    Events.listeners[ event ] = [ ...( Events.listeners[ event ] || [] ), fn ];
  },

  off: ( event, fn ) => {
    Events.check( event );
    Events.listeners[ event ] = ( Events.listeners[ event ] || [] ).filter( ( f ) => f !== fn );
  },

  // Calls each listener in order. One listener's error is logged and doesn't stop the rest.
  emit: ( event, detail ) => {
    Events.check( event );
    for ( const fn of Events.listeners[ event ] || [] ) {
      try { fn( detail ); } catch ( error ) { console.error( `"${ event }" listener failed:`, error ); }
    }
  },

};
