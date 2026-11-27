// tree.js: the sidebar file tree, from state.tree.
//
// Order: folders, then README files, then other files, A to Z. A folder named "blog" with
// month folders ("06-June") is a blog: months and years newest first, posts
// ("2026-06-28-title.md") newest first, and opening it opens the latest post.
// Rows are plain '#path' links, so clicks, keys and deep links all open files the same way.

const Tree = {

  // ── What shows (pure, tested) ──

  readme: /^readme/i,
  // A date AFTER a name marks a backup ("index-2026-10-24.html", "README 2026 09 18.md");
  // a date at the START is content ("2026-01-04-essay.md").
  datedBackup: /^.+20\d\d[-_ .]\d\d/,

  isVisible: ( item, config = CONFIG ) => {
    const parts = item.path.split( '/' );
    if ( parts.some( ( part ) => part.startsWith( '.' ) ) ) { return false; }   // dotfolders and dotfiles
    const lower = ( list ) => list.map( ( name ) => name.toLowerCase() );
    const folders = item.type === 'folder' ? parts : parts.slice( 0, -1 );
    if ( folders.some( ( part ) => lower( config.hiddenFolders ).includes( part.toLowerCase() ) ) ) { return false; }
    if ( item.type === 'folder' ) { return true; }
    const name = parts[ parts.length - 1 ].toLowerCase();
    if ( name === 'index.bak' ) { return false; }   // always hidden (SPEC.md §5)
    if ( config.hideDatedBackups && Tree.datedBackup.test( name ) ) { return false; }
    // A hiddenFiles name hides that file at any depth; '/name' hides it only at the root.
    const files = lower( config.hiddenFiles );
    return ! files.includes( name ) && ! files.includes( `/${ item.path.toLowerCase() }` );
  },

  monthOf: ( name ) => Number( ( name.match( /^(\d{2})-/ ) || [] )[ 1 ] || 0 ),       // '06-June' → 6
  yearOf: ( name ) => Number( ( name.match( /^(\d{4})$/ ) || [] )[ 1 ] || 0 ),         // '2025' → 2025
  dateOf: ( name ) => ( name.match( /^\d{4}-\d{2}-\d{2}/ ) || [] )[ 0 ] || '',         // '2026-06-28-title.md'

  // [ group, key ]: lower comes first. `mode` is '' (normal), 'blog', 'year', 'month' or 'inside' a blog.
  rank: ( node, mode ) => {
    const folder = node.type === 'folder';
    if ( folder && ( mode === 'blog' || mode === 'year' ) && Tree.monthOf( node.name ) ) { return [ 0, -Tree.monthOf( node.name ) ]; }
    if ( folder && mode === 'blog' && Tree.yearOf( node.name ) ) { return [ 1, -Tree.yearOf( node.name ) ]; }
    if ( ! folder && mode === 'month' && Tree.dateOf( node.name ) ) { return [ 0, -Number( Tree.dateOf( node.name ).replace( /-/g, '' ) ) ]; }
    return [ folder ? 2 : Tree.readme.test( node.name ) ? 3 : 4, 0 ];
  },

  compare: ( a, b, mode ) => {
    const [ groupA, keyA ] = Tree.rank( a, mode );
    const [ groupB, keyB ] = Tree.rank( b, mode );
    return groupA - groupB || keyA - keyB || a.name.toLowerCase().localeCompare( b.name.toLowerCase() );
  },

  modeOf: ( folder, parentMode ) => {
    const hasMonths = folder.children.some( ( child ) => child.type === 'folder' && Tree.monthOf( child.name ) );
    if ( ! parentMode && folder.name.toLowerCase() === 'blog' && hasMonths ) { return 'blog'; }
    if ( ! parentMode ) { return ''; }
    if ( Tree.yearOf( folder.name ) ) { return 'year'; }
    return Tree.monthOf( folder.name ) ? 'month' : 'inside';
  },

  sortFolder: ( folder, mode ) => {
    folder.children.sort( ( a, b ) => Tree.compare( a, b, mode ) );
    for ( const child of folder.children.filter( ( node ) => node.type === 'folder' ) ) {
      child.mode = Tree.modeOf( child, mode );
      Tree.sortFolder( child, child.mode );
    }
  },

  // Flat items → sorted nodes: [ { name, path, type, size, children, mode } ].
  build: ( items, config = CONFIG ) => {
    const root = { children: [] };
    const folders = new Map( [ [ '', root ] ] );
    const parentOf = ( path ) => path.split( '/' ).slice( 0, -1 ).join( '/' );
    const folderAt = ( path ) => {
      if ( ! folders.has( path ) ) {
        const node = { name: path.split( '/' ).pop(), path, type: 'folder', children: [] };
        folders.set( path, node );
        folderAt( parentOf( path ) ).children.push( node );
      }
      return folders.get( path );
    };
    for ( const item of items.filter( ( entry ) => Tree.isVisible( entry, config ) ) ) {
      if ( item.type === 'folder' ) { folderAt( item.path ); } else {
        folderAt( parentOf( item.path ) ).children.push( { name: item.path.split( '/' ).pop(), path: item.path, type: 'file', size: item.size } );
      }
    }
    Tree.sortFolder( root, '' );
    return root.children;
  },

  // The newest dated post anywhere under a blog folder: its path, or ''.
  latestPost: ( folder ) => {
    const posts = [];
    const walk = ( node ) => node.children.forEach( ( child ) => ( child.type === 'folder' ? walk( child ) : Tree.dateOf( child.name ) && posts.push( child ) ) );
    walk( folder );
    posts.sort( ( a, b ) => Tree.dateOf( b.name ).localeCompare( Tree.dateOf( a.name ) ) || a.name.localeCompare( b.name ) );
    return posts.length ? posts[ 0 ].path : '';
  },

  // The README to open for a folder ('' = the root): the shortest visible README name.
  readmeIn: ( folder, items = state.tree || [] ) => items
    .filter( ( item ) => item.type === 'file' && Tree.isVisible( item ) && Tree.readme.test( item.path.split( '/' ).pop() )
      && item.path.split( '/' ).slice( 0, -1 ).join( '/' ) === folder )
    .map( ( item ) => item.path )
    .sort( ( a, b ) => a.length - b.length || a.localeCompare( b ) )[ 0 ] || '',

  // ── Rendering ──

  icons: { md: '📝', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️',
    mp3: '🎵', wav: '🎵', ogg: '🎵', mp4: '🎞️', webm: '🎞️', pdf: '📕', csv: '📊', html: '🌐', htm: '🌐' },
  iconFor: ( name ) => Tree.icons[ name.split( '.' ).pop().toLowerCase() ] || '📄',
  label: ( name ) => Shell.escape( name.replace( /-/g, ' ' ) ),   // hyphens read as spaces

  html: ( nodes ) => nodes.map( ( node ) => {
    const path = Shell.escape( node.path );
    if ( node.type === 'folder' ) {
      const blog = node.mode === 'blog' ? ` data-blog data-latest="${ Shell.escape( Tree.latestPost( node ) ) }"` : '';
      return `<details data-path="${ path }"${ blog }><summary class="tree-folder">📁 ${ Tree.label( node.name ) }</summary>${ Tree.html( node.children ) }</details>`;
    }
    const readme = Tree.readme.test( node.name ) ? ' readme' : '';
    return `<a class="tree-item${ readme }" href="#${ Shell.escape( Router.encodePath( node.path ) ) }" data-path="${ path }">${ Tree.iconFor( node.name ) } ${ Tree.label( node.name ) }</a>`;
  } ).join( '' ),

  render: () => {
    Tree.el.tree.innerHTML = Tree.html( Tree.build( state.tree ) );
    Tree.files = Tree.el.tree.querySelectorAll( '.tree-item' ).length;
    Tree.openBefore = null;
    Tree.runFilter();
  },

  go: ( path ) => { location.hash = `#${ Router.encodePath( path ) }`; },

  // Highlights the open file and opens the folders above it.
  markActive: ( { path } ) => {
    const old = Tree.el.tree.querySelector( '.tree-item.active' );
    if ( old ) { old.classList.remove( 'active' ); }
    const item = Tree.el.tree.querySelector( `.tree-item[data-path="${ CSS.escape( path ) }"]` );
    if ( ! item ) { return; }
    item.classList.add( 'active' );
    for ( let folder = item.closest( 'details' ); folder; folder = folder.parentElement.closest( 'details' ) ) {
      folder.dataset.seen = 'yes';   // opened by us, so no README auto-open
      folder.open = true;
    }
    item.scrollIntoView( { block: 'nearest' } );
    if ( Tree.isNarrow() ) { Tree.setCollapsed( true, false ); }
  },

  // The first time a folder is opened by hand: a blog opens its latest post, any other folder its README.
  onToggle: ( event ) => {
    const folder = event.target;
    if ( ! folder.open || folder.dataset.seen ) { return; }
    folder.dataset.seen = 'yes';
    const readme = folder.querySelector( ':scope > .tree-item.readme' );
    const target = folder.dataset.latest
      || ( CONFIG.autoOpenFolderReadme && ! folder.closest( '[data-blog]' ) && readme && readme.dataset.path );
    if ( target ) { Tree.go( target ); }
  },

  // ── Filter: matches file names; hyphens and spaces count as the same ──

  normalize: ( text ) => text.toLowerCase().replace( /[-\s]+/g, ' ' ).trim(),
  matches: ( name, query ) => Tree.normalize( name ).includes( Tree.normalize( query ) ),

  runFilter: () => {
    const { tree, filter, count } = Tree.el;
    const query = filter.value;
    const folders = [ ...tree.querySelectorAll( 'details' ) ];
    if ( ! Tree.normalize( query ) ) {
      tree.classList.remove( 'filtering' );
      tree.querySelectorAll( '.is-hidden' ).forEach( ( node ) => node.classList.remove( 'is-hidden' ) );
      if ( Tree.openBefore ) { folders.forEach( ( folder ) => { folder.open = Tree.openBefore.has( folder.dataset.path ); } ); }
      Tree.openBefore = null;
      count.textContent = `${ ( Tree.files || 0 ).toLocaleString() } files`;
      return;
    }
    Tree.openBefore = Tree.openBefore || new Set( folders.filter( ( folder ) => folder.open ).map( ( folder ) => folder.dataset.path ) );
    const items = [ ...tree.querySelectorAll( '.tree-item' ) ];
    const hits = new Set( items.filter( ( item ) => Tree.matches( item.dataset.path.split( '/' ).pop(), query ) ) );   // a Set: fast on big trees
    items.forEach( ( item ) => item.classList.toggle( 'is-hidden', ! hits.has( item ) ) );
    folders.reverse().forEach( ( folder ) => {
      const any = folder.querySelector( '.tree-item:not(.is-hidden)' );
      folder.classList.toggle( 'is-hidden', ! any );
      if ( any ) { folder.dataset.seen = 'yes'; folder.open = true; }
    } );
    tree.classList.add( 'filtering' );
    count.textContent = `${ hits.size } match${ hits.size === 1 ? '' : 'es' }`;
  },

  // ── Keyboard: / filter, \ tree, arrows, Home / End, Enter / Space, Ctrl+B ──

  // A row shows when it isn't filtered out and every folder above it is open.
  isShown: ( row ) => {
    if ( row.closest( '.is-hidden' ) ) { return false; }
    const start = row.tagName === 'SUMMARY' ? row.parentElement.parentElement : row;
    for ( let folder = start.closest( 'details' ); folder; folder = folder.parentElement.closest( 'details' ) ) {
      if ( ! folder.open ) { return false; }
    }
    return true;
  },

  rows: () => [ ...Tree.el.tree.querySelectorAll( 'summary, .tree-item' ) ].filter( Tree.isShown ),

  onKey: ( event ) => {
    const { tree, filter } = Tree.el;
    const active = document.activeElement;
    const typing = active && ( /^(INPUT|TEXTAREA|SELECT)$/.test( active.tagName ) || active.isContentEditable );
    const done = () => event.preventDefault();
    if ( ( event.ctrlKey || event.metaKey ) && ! event.altKey && event.key.toLowerCase() === 'b' ) { done(); Tree.toggle(); return; }
    if ( event.key === '/' && ! typing ) { done(); filter.focus(); return; }
    if ( event.key === '\\' && ( ! typing || active === filter ) ) {
      done();
      const current = tree.querySelector( '.tree-item.active' );
      const target = current && Tree.isShown( current ) ? current : Tree.rows()[ 0 ];
      if ( target ) { target.focus(); }
      return;
    }
    if ( ! tree.contains( active ) ) { return; }
    const rows = Tree.rows();
    const index = rows.indexOf( active );
    if ( index === -1 ) { return; }
    const folder = active.tagName === 'SUMMARY' ? active.parentElement : null;
    // Moving onto a file opens it, as today.
    const moveTo = ( row ) => { if ( row && row !== active ) { row.focus(); if ( row.dataset.path ) { Tree.go( row.dataset.path ); } } };
    const keys = {
      ArrowDown: () => moveTo( rows[ index + 1 ] ),
      ArrowUp: () => moveTo( rows[ index - 1 ] ),
      Home: () => moveTo( rows[ 0 ] ),
      End: () => moveTo( rows[ rows.length - 1 ] ),
      ArrowRight: () => { if ( folder && ! folder.open ) { folder.open = true; } else if ( folder ) { moveTo( rows[ index + 1 ] ); } },
      ArrowLeft: () => {
        if ( folder && folder.open ) { folder.open = false; return; }
        const parent = ( folder || active ).parentElement.closest( 'details' );
        if ( parent ) { parent.querySelector( ':scope > summary' ).focus(); }
      },
    };
    // Enter and Space on a folder are the browser's own <summary> toggle.
    if ( ! folder && ( event.key === 'Enter' || event.key === ' ' ) ) { done(); Tree.go( active.dataset.path ); return; }
    if ( keys[ event.key ] ) { done(); keys[ event.key ](); }
  },

  // ── Collapse and resize, saved per page. Narrow screens start collapsed. ──

  isNarrow: () => window.matchMedia( '(max-width: 700px)' ).matches,

  setCollapsed: ( collapsed, save = true ) => {
    Tree.el.root.classList.toggle( 'sidebar-hidden', collapsed );
    if ( save ) { Shell.save( 'sidebarHidden', collapsed ); }
  },

  toggle: () => Tree.setCollapsed( ! Tree.el.root.classList.contains( 'sidebar-hidden' ), ! Tree.isNarrow() ),

  startResize: ( event ) => {
    const resizer = event.target;
    resizer.setPointerCapture( event.pointerId );
    const move = ( e ) => Tree.el.root.style.setProperty( '--sidebar-width', `${ Math.min( window.innerWidth - 200, Math.max( 120, e.clientX ) ) }px` );
    const stop = () => {
      resizer.removeEventListener( 'pointermove', move );
      Shell.save( 'sidebarWidth', Tree.el.root.style.getPropertyValue( '--sidebar-width' ) );
    };
    resizer.addEventListener( 'pointermove', move );
    resizer.addEventListener( 'pointerup', stop, { once: true } );
  },

  // root: the view element holding .tree, .tree-filter, .tree-count, .resizer and .sidebar-toggle.
  mount: ( root ) => {
    const find = ( selector ) => root.querySelector( selector );
    Tree.el = { root, tree: find( '.tree' ), filter: find( '.tree-filter' ), count: find( '.tree-count' ) };
    const width = Shell.load( 'sidebarWidth' );
    if ( width ) { root.style.setProperty( '--sidebar-width', width ); }
    Tree.setCollapsed( Tree.isNarrow() || Shell.load( 'sidebarHidden' ) === true, false );
    Tree.el.tree.addEventListener( 'toggle', Tree.onToggle, true );   // 'toggle' doesn't bubble
    Tree.el.filter.addEventListener( 'input', Tree.runFilter );
    Tree.el.filter.addEventListener( 'keydown', ( event ) => { if ( event.key === 'Escape' ) { Tree.el.filter.value = ''; Tree.runFilter(); } } );
    find( '.resizer' ).addEventListener( 'pointerdown', Tree.startResize );
    find( '.sidebar-toggle' ).addEventListener( 'click', Tree.toggle );
    document.addEventListener( 'keydown', Tree.onKey );
    Events.on( 'tree-loaded', Tree.render );
    Events.on( 'file-selected', Tree.markActive );
    return () => {
      document.removeEventListener( 'keydown', Tree.onKey );
      Events.off( 'tree-loaded', Tree.render );
      Events.off( 'file-selected', Tree.markActive );
    };
  },

};
