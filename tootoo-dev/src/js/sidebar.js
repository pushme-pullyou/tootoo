/* TooToo — sidebar.js  (the "what files exist & how they're shown" component).
   Ported from reference §18-§26. Reads: state.tree, CONFIG.hidden*.
   Writes: nothing global — display only. Hands off via Content's selectFile(path).
   Depends on core.js helpers + globals CONFIG/state (mock-data.js).

   NOTE: the real renderTree batches with a "% rendered" status for huge repos;
   here it's synchronous for clarity. Re-add batching when we carve for real. */

/* ── build nested tree from the flat GitHub list ── */
const buildNestedTree = ( flatTree ) => {
  const root = { children: {} };
  const hidFolders = hiddenFolderSet();
  const hidFiles = hiddenFileSet();
  for ( const item of flatTree ) {
    if ( !isVisibleTreeItem( item, hidFolders, hidFiles ) ) continue;
    const parts = item.path.split( '/' );
    let current = root;
    for ( let i = 0; i < parts.length; i++ ) {
      const part = parts[ i ];
      if ( !current.children[ part ] ) {
        current.children[ part ] = { children: {}, type: null, size: null, path: null };
      }
      if ( i === parts.length - 1 ) {
        current.children[ part ].type = item.type;
        current.children[ part ].size = item.size;
        current.children[ part ].path = item.path;
      }
      current = current.children[ part ];
    }
  }
  return root;
};

/* ── blog mode (auto, by convention) ──
   A folder named "blog" holding NN-Month subfolders becomes a reverse-chronological
   logbook: newest post on top, newest month/year first, and the path to the latest
   post pre-expanded. Patterns: month "06-June", year "2025", post "2026-06-28-title". */
const BLOG_MONTH_RE = /^(\d{2})-/;
const BLOG_YEAR_RE = /^(\d{4})$/;
const BLOG_DATE_RE = /^(\d{4}-\d{2}-\d{2})/;
const isFolderNode = ( node ) => node.type === 'tree' || Object.keys( node.children ).length > 0;
const monthNum = ( name ) => { const m = name.match( BLOG_MONTH_RE ); return m ? +m[ 1 ] : -1; };
const yearNum = ( name ) => { const m = name.match( BLOG_YEAR_RE ); return m ? +m[ 1 ] : -1; };
const postDate = ( name ) => { const m = name.match( BLOG_DATE_RE ); return m ? m[ 1 ] : null; };
const hasMonthChild = ( node ) =>
  Object.entries( node.children ).some( ( [ n, c ] ) => isFolderNode( c ) && monthNum( n ) >= 0 );

/* default order: folders first, then alphabetical (the non-blog behavior). */
const cmpDefault = ( [ aName, aNode ], [ bName, bNode ] ) => {
  const af = isFolderNode( aNode ), bf = isFolderNode( bNode );
  if ( af && !bf ) return -1;
  if ( !af && bf ) return 1;
  return aName.toLowerCase().localeCompare( bName.toLowerCase() );
};
/* blog root: current-year month folders (desc) → past-year folders (desc) → other
   folders (alpha) → files. */
const cmpBlogRoot = ( [ aN, aNode ], [ bN, bNode ] ) => {
  const rank = ( n, node ) => !isFolderNode( node ) ? 3 : monthNum( n ) >= 0 ? 0 : yearNum( n ) >= 0 ? 1 : 2;
  const ra = rank( aN, aNode ), rb = rank( bN, bNode );
  if ( ra !== rb ) return ra - rb;
  if ( ra === 0 ) return monthNum( bN ) - monthNum( aN );   // months descending
  if ( ra === 1 ) return yearNum( bN ) - yearNum( aN );     // years descending
  return aN.toLowerCase().localeCompare( bN.toLowerCase() );
};
/* year folder: its month folders descending, then anything else. */
const cmpYearFolder = ( [ aN, aNode ], [ bN, bNode ] ) => {
  const rank = ( n, node ) => isFolderNode( node ) && monthNum( n ) >= 0 ? 0 : isFolderNode( node ) ? 1 : 2;
  const ra = rank( aN, aNode ), rb = rank( bN, bNode );
  if ( ra !== rb ) return ra - rb;
  if ( ra === 0 ) return monthNum( bN ) - monthNum( aN );   // months descending
  return aN.toLowerCase().localeCompare( bN.toLowerCase() );
};
/* month folder: dated posts newest-first (same date → title asc), then the rest below. */
const cmpMonthFolder = ( [ aN, aNode ], [ bN, bNode ] ) => {
  const ad = !isFolderNode( aNode ) && postDate( aN );
  const bd = !isFolderNode( bNode ) && postDate( bN );
  if ( ad && bd ) return ad !== bd ? bd.localeCompare( ad ) : aN.toLowerCase().localeCompare( bN.toLowerCase() );
  if ( ad ) return -1;          // dated posts above non-dated files + folders
  if ( bd ) return 1;
  return cmpDefault( [ aN, aNode ], [ bN, bNode ] );
};
const BLOG_CMP = { blogRoot: cmpBlogRoot, yearFolder: cmpYearFolder, monthFolder: cmpMonthFolder };

/* Newest dated post in a blog subtree → the file to auto-open + the chain of
   year/month folders to pre-expand down to it (blog root itself stays collapsed). */
const collectDatedPosts = ( node, path, out ) => {
  for ( const [ name, child ] of Object.entries( node.children ) ) {
    const childPath = path ? `${ path }/${ name }` : name;
    if ( isFolderNode( child ) ) collectDatedPosts( child, childPath, out );
    else if ( postDate( name ) ) out.push( { date: postDate( name ), name, path: childPath } );
  }
  return out;
};
const findLatestPost = ( blogNode, blogPath ) => {
  const posts = collectDatedPosts( blogNode, blogPath, [] );
  if ( !posts.length ) return { expandPaths: new Set(), postPath: '' };
  posts.sort( ( a, b ) => a.date !== b.date ? b.date.localeCompare( a.date ) : a.name.toLowerCase().localeCompare( b.name.toLowerCase() ) );
  const parts = posts[ 0 ].path.split( '/' );
  const depth = blogPath.split( '/' ).length;
  const expandPaths = new Set();
  for ( let i = depth + 1; i < parts.length; i++ ) expandPaths.add( parts.slice( 0, i ).join( '/' ) );
  return { expandPaths, postPath: posts[ 0 ].path };
};

/* ── sort entries; `mode` (blog context) picks the comparator, else default. ── */
const sortedEntries = ( children, mode ) =>
  Object.entries( children ).sort( BLOG_CMP[ mode ] || cmpDefault );

/* ── recursive folder contents (for the folder tooltip) ── */
const folderStats = ( node ) => {
  let files = 0, folders = 0, bytes = 0;
  for ( const child of Object.values( node.children ) ) {
    const isFolder = child.type === 'tree' || Object.keys( child.children ).length > 0;
    if ( isFolder ) {
      folders++;
      const s = folderStats( child );
      files += s.files; folders += s.folders; bytes += s.bytes;
    } else {
      files++; bytes += ( child.size || 0 );
    }
  }
  return { files, folders, bytes };
};

/* ── one tree node -> HTML (recursive for folders) ──
   `blog` carries the blog context once we're inside a "blog" folder
   ({ expandPaths }), so descendant year/month folders sort reverse-chrono and the
   path to the latest post renders pre-expanded. */
const renderNode = ( name, node, parentPath, blog ) => {
  const fullPath = parentPath ? `${ parentPath }/${ name }` : name;
  const isFolder = node.type === 'tree' || Object.keys( node.children ).length > 0;
  const displayName = displayTreeName( name );

  if ( isFolder ) {
    // Blog detection + per-folder sort mode. The "blog" folder itself becomes the
    // root; year/month folders beneath it get their own ordering.
    let childBlog = blog, mode = null, blogAttr = '';
    if ( !blog && name.toLowerCase() === 'blog' && hasMonthChild( node ) ) {
      const latest = findLatestPost( node, fullPath );
      childBlog = { expandPaths: latest.expandPaths };
      mode = 'blogRoot';
      blogAttr = ` data-blog-root data-blog-latest="${ escapeHTML( latest.postPath ) }"`;
    } else if ( blog ) {
      mode = yearNum( name ) >= 0 ? 'yearFolder' : monthNum( name ) >= 0 ? 'monthFolder' : null;
    }
    const open = ( blog && blog.expandPaths.has( fullPath ) ) ? ' open' : '';

    // Auto-open this folder's own README the first time it's expanded. Skipped for blog
    // roots (they open their latest post instead) and inside the blog subtree.
    let readmeAttr = '';
    if ( CONFIG.autoOpenFolderReadme !== false && !blog && !blogAttr ) {
      const readme = Object.entries( node.children ).find(
        ( [ n, c ] ) => c.type === 'blob' && /^readme/i.test( n ) );
      if ( readme ) readmeAttr = ` data-readme="${ escapeHTML( readme[ 1 ].path ) }"`;
    }

    const childrenHtml = sortedEntries( node.children, mode )
      .map( ( [ childName, childNode ] ) => renderNode( childName, childNode, fullPath, childBlog ) )
      .join( '' );
    // Tooltip: what's inside — recursive file/folder counts + total size.
    const s = folderStats( node );
    const tip = `${ fullPath } — ${ s.files } file${ s.files === 1 ? '' : 's' }` +
      ( s.folders ? ` · ${ s.folders } folder${ s.folders === 1 ? '' : 's' }` : '' ) +
      ` · ${ formatFileSize( s.bytes ) }`;
    return `<details${ open }${ blogAttr }${ readmeAttr } data-folder-path="${ escapeHTML( fullPath ) }">` +
      `<summary class="tree-folder" tabindex="0" title="${ escapeHTML( tip ) }">` +
      `<span aria-hidden="true">📁</span> <span class="folder-name">${ escapeHTML( displayName ) }</span>` +
      `</summary>` + childrenHtml + `</details>`;
  }

  const icon = getFileIcon( name );
  const isReadme = /^readme/i.test( name );
  const nameHtml = isReadme ? `<strong>${ escapeHTML( displayName ) }</strong>` : escapeHTML( displayName );
  const folderDisplay = parentPath ? parentPath.split( '/' ).map( displayTreeName ).join( ' / ' ) : '';
  const folderHtml = folderDisplay ? `<span class="tree-item-folder">${ escapeHTML( folderDisplay ) }</span>` : '';
  // Tooltip: path on line 1, then "Type · size" — the size now lives here, not on the row.
  const tip = `${ fullPath }\n${ getFileTypeLabel( name ) } · ${ formatFileSize( node.size || 0 ) }`;

  return `<div class="tree-item" role="button" tabindex="0" data-action="select-file" data-path="${ escapeHTML( fullPath ) }" title="${ escapeHTML( tip ) }">` +
    `<span class="tree-item-name"><span aria-hidden="true">${ icon }</span> ${ nameHtml }</span>` + folderHtml + `</div>`;
};

/* ── expand-all glyph state ── */
const setExpandAllButton = ( expanded ) => {
  const btn = document.getElementById( 'btnExpandAll' );
  if ( !btn ) return;
  btn.textContent = expanded ? '⊟' : '⊞';
  const label = expanded ? 'Collapse all folders' : 'Expand all folders';
  btn.title = label;
  btn.setAttribute( 'aria-label', label );
};

/* ── auto-open on first manual expand. Bound to the summary click (a real gesture) so
   the filter / expand-all opening a folder programmatically doesn't hijack the content
   pane. A blog root opens its latest post; any other folder opens its own README. ── */
const wireFirstOpen = ( selector, attr ) => {
  document.querySelectorAll( selector ).forEach( ( d ) => {
    const path = d.getAttribute( attr );
    const summary = d.querySelector( ':scope > summary' );
    if ( !path || !summary ) return;
    let opened = false;
    summary.addEventListener( 'click', () => {
      if ( opened ) return;
      // Let the native <details> toggle finish, then open the target if it expanded.
      setTimeout( () => {
        if ( d.open && typeof selectFile === 'function' ) { opened = true; selectFile( path ); }
      }, 0 );
    } );
  } );
};
const wireBlogAutoOpen = () => wireFirstOpen( 'details[data-blog-root]', 'data-blog-latest' );
const wireFolderReadmeAutoOpen = () => wireFirstOpen( 'details[data-readme]', 'data-readme' );

/* ── render the whole tree ── */
const renderTree = ( treeArray ) => {
  const treeList = document.getElementById( 'treeList' );
  preFilterOpenState = null;
  setExpandAllButton( false );
  const nested = buildNestedTree( treeArray );
  const entries = sortedEntries( nested.children, null );
  treeList.innerHTML = entries.map( ( [ name, node ] ) => renderNode( name, node, '', null ) ).join( '' );
  refreshTreeCache();
  wireBlogAutoOpen();
  wireFolderReadmeAutoOpen();
};

/* ── filter (reference §23) ── */
let preFilterOpenState = null;
let treeSummaryText = '';
let cachedTreeItems = [];
let cachedTreeFolders = [];

const refreshTreeCache = () => {
  const treeList = document.getElementById( 'treeList' );
  cachedTreeItems = Array.from( treeList.querySelectorAll( '.tree-item' ) );
  cachedTreeFolders = Array.from( treeList.querySelectorAll( 'details' ) );
};

const runFilter = () => {
  const treeList = document.getElementById( 'treeList' );
  const query = document.getElementById( 'treeFilter' ).value.trim().toLowerCase();
  const btnFilterClear = document.getElementById( 'btnFilterClear' );
  const normalizedQuery = query.replace( /[-\s]+/g, ' ' );
  btnFilterClear.style.display = query ? 'block' : 'none';

  const items = cachedTreeItems;
  const folders = cachedTreeFolders;

  if ( !query ) {
    treeList.classList.remove( 'filtering' );
    if ( treeSummaryText ) document.getElementById( 'hFiles' ).textContent = treeSummaryText;
    items.forEach( ( el ) => el.classList.remove( 'is-hidden' ) );
    folders.forEach( ( el ) => el.classList.remove( 'is-hidden' ) );
    if ( preFilterOpenState ) {
      folders.forEach( ( details ) => {
        const key = details.dataset.folderPath;
        if ( preFilterOpenState.has( key ) ) details.open = preFilterOpenState.get( key );
      } );
      preFilterOpenState = null;
    }
    return;
  }

  if ( preFilterOpenState === null ) {
    preFilterOpenState = new Map();
    folders.forEach( ( details ) => preFilterOpenState.set( details.dataset.folderPath, details.open ) );
  }

  let matchCount = 0;
  items.forEach( ( el ) => {
    const name = ( el.dataset.path || '' ).split( '/' ).pop().toLowerCase();
    const normalizedName = name.replace( /[-\s]+/g, ' ' );
    const matches = name.includes( query ) || normalizedName.includes( normalizedQuery );
    el.classList.toggle( 'is-hidden', !matches );
    if ( matches ) matchCount++;
  } );

  folders.slice().reverse().forEach( ( details ) => {
    const hasVisible = details.querySelector( '.tree-item:not(.is-hidden)' );
    if ( hasVisible ) { details.classList.remove( 'is-hidden' ); details.open = true; }
    else { details.classList.add( 'is-hidden' ); }
  } );

  treeList.classList.add( 'filtering' );
  document.getElementById( 'hFiles' ).textContent =
    `${ matchCount.toLocaleString() } match${ matchCount === 1 ? '' : 'es' }`;
};

/* ── debounce ── */
const debounce = ( fn, ms ) => {
  let timer;
  return ( ...args ) => { clearTimeout( timer ); timer = setTimeout( () => fn( ...args ), ms ); };
};

/* ── expand/collapse all ── */
const setupExpandAll = () => {
  const btn = document.getElementById( 'btnExpandAll' );
  btn.addEventListener( 'click', () => {
    const allDetails = document.getElementById( 'treeList' ).querySelectorAll( 'details' );
    const expand = btn.textContent.trim() !== '⊟';
    allDetails.forEach( ( d ) => { d.open = expand; } );
    setExpandAllButton( expand );
  } );
};

/* ── selection: hand off to Content (reference §26) ── */
const setupFileSelection = () => {
  document.getElementById( 'treeList' ).addEventListener( 'click', ( e ) => {
    const target = e.target.closest( '[data-action="select-file"]' );
    if ( !target ) return;
    selectFile( target.dataset.path );   // Content owns currentFilePath
  } );
};

// Bail out for very large repositories (or truncated GitHub tree responses):
// keep sidebar concise and show a clear explanation + link in the content pane.
const showOversizedRepoPanel = ( count, truncated ) => {
  const repoUrl = `https://github.com/${ encodeURIComponent( state.owner ) }/${ encodeURIComponent( state.repo ) }`;
  const countLabel = truncated
    ? `over ${ count.toLocaleString() } files (GitHub truncated the tree response)`
    : `${ count.toLocaleString() } files`;

  document.getElementById( 'treeList' ).innerHTML =
    '<div style="padding: 0.6rem 0.5rem; font-size: 0.85rem; opacity: 0.8;">Repository too large to browse here.</div>';

  const cb = document.getElementById( 'contentBody' );
  cb.innerHTML = `
        <div class="error-panel">
          <h3 style="margin-top: 0;">Repository too large for ${ escapeHTML( CONFIG.appName ) }</h3>
          <p><strong>${ escapeHTML( state.owner ) }/${ escapeHTML( state.repo ) }</strong> contains ${ escapeHTML( countLabel ) }. ${ escapeHTML( CONFIG.appName ) } is built for small-to-medium personal repositories; larger trees overwhelm the sidebar render and the per-keystroke filter.</p>
          <p><a href="${ escapeHTML( repoUrl ) }" target="_blank" rel="noopener">Browse this repository on github.com →</a></p>
          <p style="font-size: 0.85rem; opacity: 0.75; margin-bottom: 0;">If you maintain a fork, raise <code>CONFIG.maxRepoFiles</code> (currently ${ CONFIG.maxRepoFiles.toLocaleString() }) to override this cutoff. Truncated trees cannot be overridden — that is a GitHub API response limit.</p>
        </div>
      `;
};

/* ── fetchTree: load the repo tree from GitHub (writes state.tree) ── */
const fetchTree = async () => {
  const signal = newAbort();
  const treeList = document.getElementById( 'treeList' );
  treeList.innerHTML = '<p style="padding:0.5rem;">Loading tree…</p>';
  try {
    if ( !state.branch ) state.branch = await getDefaultBranch( signal );
    cacheRepo();   // persist owner/repo/branch now that the branch is resolved
    setHeaderTimestamp();   // refresh the title tooltip with this repo's last-push date
    updateBranchControl();   // show the branch chip in the sidebar header
    const data = await ghApi( `https://api.github.com/repos/${ encodeURIComponent( state.owner ) }/${ encodeURIComponent( state.repo ) }/git/trees/${ encodeURIComponent( state.branch ) }?recursive=1`, signal );
    const count = data.tree?.length || 0;
    if ( data.truncated || count > CONFIG.maxRepoFiles ) {
      state.tree = null;
      state.oversized = true;
      showOversizedRepoPanel( count, data.truncated );
      return;
    }
    state.oversized = false;
    state.tree = data.tree;
    renderTree( state.tree );

    // Sidebar summary: 📁 folders · 📄 files · size (matches what renders).
    const hidF = hiddenFolderSet(), hidf = hiddenFileSet();
    const vis = state.tree.filter( ( i ) => isVisibleTreeItem( i, hidF, hidf ) );
    const folders = vis.filter( ( i ) => i.type === 'tree' ).length;
    const files = vis.filter( ( i ) => i.type === 'blob' ).length;
    const bytes = vis.reduce( ( s, i ) => s + ( i.type === 'blob' ? ( i.size || 0 ) : 0 ), 0 );
    const h = document.getElementById( 'hFiles' );
    h.textContent = `${ files.toLocaleString() } file${ files === 1 ? '' : 's' } · ${ formatFileSize( bytes ) }`;
    // Spelled-out tooltip (includes the folder count + truncated summary on a narrow sidebar).
    h.title = `${ folders.toLocaleString() } folder${ folders === 1 ? '' : 's' }, ` +
      `${ files.toLocaleString() } file${ files === 1 ? '' : 's' }, ${ formatFileSize( bytes ) } total`;
    treeSummaryText = h.textContent;
  } catch ( err ) {
    if ( err.name === 'AbortError' ) return;
    if ( err.status === 403 ) {
      treeList.innerHTML = `<p style="padding:0.5rem;color:red;">Rate limited. Add a GitHub token for higher limits.</p>`;
      showTokenPanel( RATE_LIMIT_REASON_HTML );
      return;
    }
    if ( err.status === 404 ) {
      treeList.innerHTML = `<p style="padding:0.5rem;color:red;">${ escapeHTML( PRIVATE_REPO_MESSAGE ) }</p>`;
      showTokenPanel( privateRepoReasonHtml() );
      return;
    }
    treeList.innerHTML = `<p style="padding:0.5rem;color:red;">${ escapeHTML( err.message ) }</p>`;
  }
};

/* ── pick the root README on first load ── */
const autoSelectReadme = () => {
  if ( !state.tree ) return;
  const readme = state.tree.find( ( i ) => i.type === 'blob' && !i.path.includes( '/' ) && /^readme/i.test( i.path ) );
  if ( readme ) selectFile( readme.path );
};

/* ── keyboard navigation (reference §27) ── */
const getVisibleTreeItems = () => {
  const treeList = document.getElementById( 'treeList' );
  const all = treeList.querySelectorAll( '.tree-folder, .tree-item' );
  const filtering = treeList.classList.contains( 'filtering' );
  return Array.from( all ).filter( ( el ) => {
    if ( el.classList.contains( 'is-hidden' ) ) return false;
    if ( filtering && el.classList.contains( 'tree-folder' ) ) return false;
    const start = el.classList.contains( 'tree-folder' ) ? el.parentElement : el;
    if ( el.classList.contains( 'tree-folder' ) && start?.classList.contains( 'is-hidden' ) ) return false;
    let ancestor = el.classList.contains( 'tree-folder' ) ? start?.parentElement : el.parentElement;
    while ( ancestor && ancestor !== treeList ) {
      if ( ancestor.tagName === 'DETAILS' && ( !ancestor.open || ancestor.classList.contains( 'is-hidden' ) ) ) return false;
      ancestor = ancestor.parentElement;
    }
    return true;
  } );
};

const selectFileItem = ( el ) => { if ( el.classList.contains( 'tree-item' ) ) selectFile( el.dataset.path ); };

const setupKeyboardNav = () => {
  document.addEventListener( 'keydown', ( e ) => {
    const treeList = document.getElementById( 'treeList' );
    const active = document.activeElement;

    if ( ( e.ctrlKey || e.metaKey ) && !e.altKey && ( e.key === 'b' || e.key === 'B' ) ) {
      e.preventDefault();
      if ( typeof toggleSidebar === 'function' ) toggleSidebar();
      return;
    }
    if ( e.key === '/' && active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA' ) {
      e.preventDefault(); document.getElementById( 'treeFilter' ).focus(); return;
    }
    // `\` focuses the tree. Allowed from the filter input too, so / and \ toggle
    // between filter and tree (in the filter we must preventDefault so it isn't typed).
    if ( e.key === '\\' && ( active.id === 'treeFilter' || ( active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA' ) ) ) {
      e.preventDefault();
      const visible = getVisibleTreeItems();
      if ( !visible.length ) return;
      const activeItem = document.querySelector( '#treeList .tree-item.active' );
      const target = ( activeItem && visible.includes( activeItem ) ) ? activeItem : visible[ 0 ];
      target.focus(); target.scrollIntoView( { block: 'nearest' } );
      return;
    }

    if ( !treeList || !treeList.contains( active ) ) return;
    if ( !active.classList.contains( 'tree-folder' ) && !active.classList.contains( 'tree-item' ) ) return;
    const visible = getVisibleTreeItems();
    const idx = visible.indexOf( active );
    if ( idx === -1 ) return;

    switch ( e.key ) {
      case 'ArrowDown': { e.preventDefault(); const n = visible[ idx + 1 ]; if ( n ) { n.focus(); selectFileItem( n ); } break; }
      case 'ArrowUp': { e.preventDefault(); const p = visible[ idx - 1 ]; if ( p ) { p.focus(); selectFileItem( p ); } break; }
      case 'Home': { e.preventDefault(); const f = visible[ 0 ]; if ( f && f !== active ) { f.focus(); selectFileItem( f ); } break; }
      case 'End': { e.preventDefault(); const l = visible[ visible.length - 1 ]; if ( l && l !== active ) { l.focus(); selectFileItem( l ); } break; }
      case 'PageDown':
      case 'PageUp': {
        e.preventDefault();
        const h = active.getBoundingClientRect().height || 24;
        const page = Math.max( 1, Math.floor( treeList.clientHeight / h ) - 1 );
        const ni = Math.max( 0, Math.min( idx + ( e.key === 'PageDown' ? 1 : -1 ) * page, visible.length - 1 ) );
        const t = visible[ ni ]; if ( t && t !== active ) { t.focus(); selectFileItem( t ); }
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if ( active.classList.contains( 'tree-folder' ) ) active.parentElement.open = !active.parentElement.open;
        else selectFileItem( active );
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        if ( active.classList.contains( 'tree-folder' ) ) {
          const d = active.parentElement;
          if ( !d.open ) d.open = true;
          else { const c = d.querySelector( '.tree-folder, .tree-item' ); if ( c && c !== active ) { c.focus(); selectFileItem( c ); } }
        }
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        if ( active.classList.contains( 'tree-folder' ) ) {
          const d = active.parentElement;
          if ( d.open ) d.open = false;
          else { const ps = d.parentElement?.closest( 'details' )?.querySelector( ':scope > summary' ); if ( ps ) ps.focus(); }
        } else {
          const ps = active.closest( 'details' )?.querySelector( ':scope > summary' ); if ( ps ) ps.focus();
        }
        break;
      }
    }
  } );
};

/* ── branch switcher (reference §branch) — the chip lists the repo's branches
   and switches in place (re-fetch tree + re-open README, no reload). ── */
let branchList = null;
const updateBranchControl = () => {
  const btn = document.getElementById( 'btnBranch' );
  const name = document.getElementById( 'branchName' );
  if ( !btn || !name ) return;
  if ( !state.branch ) { btn.hidden = true; return; }
  name.textContent = state.branch;
  btn.title = `Branch: ${ state.branch } — click to switch`;
  btn.hidden = false;
};
const closeBranchMenu = () => {
  const menu = document.getElementById( 'branchMenu' );
  if ( menu ) menu.hidden = true;
  document.getElementById( 'btnBranch' )?.setAttribute( 'aria-expanded', 'false' );
};
const fetchBranchList = async () => {
  if ( branchList ) return branchList;
  const data = await ghApi( `https://api.github.com/repos/${ encodeURIComponent( state.owner ) }/${ encodeURIComponent( state.repo ) }/branches?per_page=100` );
  branchList = data.map( ( b ) => b.name );
  branchList.capped = data.length === 100;
  return branchList;
};
const openBranchMenu = async () => {
  const menu = document.getElementById( 'branchMenu' );
  const btn = document.getElementById( 'btnBranch' );
  if ( !menu || !btn ) return;
  menu.hidden = false;
  btn.setAttribute( 'aria-expanded', 'true' );
  menu.innerHTML = '<div class="branch-menu-loading">Loading branches…</div>';
  try {
    const branches = await fetchBranchList();
    menu.innerHTML = branches.map( ( b ) =>
      `<button type="button" role="option" class="branch-option${ b === state.branch ? ' is-current' : '' }" data-branch="${ escapeHTML( b ) }">${ b === state.branch ? '✓ ' : '' }${ escapeHTML( b ) }</button>`
    ).join( '' ) + ( branches.capped ? '<div class="branch-menu-error">Showing first 100 branches.</div>' : '' );
  } catch ( _ ) {
    menu.innerHTML = '<div class="branch-menu-error">Could not load branches.</div>';
  }
};
const toggleBranchMenu = () => {
  const menu = document.getElementById( 'branchMenu' );
  if ( menu && !menu.hidden ) closeBranchMenu(); else openBranchMenu();
};
const switchBranch = async ( branch ) => {
  closeBranchMenu();
  if ( !branch || branch === state.branch ) return;
  state.branch = branch;
  state.tree = null;
  branchList = null;          // re-list for the new branch context if reopened
  cacheRepo();
  clearFileCache();
  updateBranchControl();
  await fetchTree();
  autoSelectReadme();
};

/* ── init: render + wire ── */
const initSidebar = () => {
  if ( state.tree ) renderTree( state.tree );
  treeSummaryText = document.getElementById( 'hFiles' ).textContent;
  const filter = document.getElementById( 'treeFilter' );
  filter.addEventListener( 'input', debounce( runFilter, 120 ) );
  filter.addEventListener( 'keydown', ( e ) => { if ( e.key === 'Escape' ) { filter.value = ''; runFilter(); } } );
  document.getElementById( 'btnFilterClear' ).addEventListener( 'click', () => {
    filter.value = ''; runFilter(); filter.focus();
  } );
  setupKeyboardNav();
  setupExpandAll();
  setupFileSelection();
  const exp = document.getElementById( 'btnExpandAll' );
  if ( exp ) exp.style.display = '';

  // Branch switcher chip + menu.
  document.getElementById( 'btnBranch' )?.addEventListener( 'click', toggleBranchMenu );
  document.getElementById( 'branchMenu' )?.addEventListener( 'click', ( e ) => {
    const opt = e.target.closest( '[data-branch]' );
    if ( opt ) switchBranch( opt.dataset.branch );
  } );
  document.addEventListener( 'click', ( e ) => {
    if ( !e.target.closest( '.branch-control' ) ) closeBranchMenu();
  } );

  // Sidebar footer brand mark (from CONFIG favicon) + scroll-to-top.
  const footImg = document.querySelector( '#btnScrollTreeTop img' );
  if ( footImg ) footImg.src = brandMarkSrc();
  document.getElementById( 'btnScrollTreeTop' )?.addEventListener( 'click', () =>
    document.getElementById( 'treeList' ).scrollTo( { top: 0, behavior: 'smooth' } ) );

  // Resizer drag (real app does this in setupListeners; minimal version here).
  const resizer = document.getElementById( 'resizer' );
  if ( resizer ) {
    let dragging = false;
    resizer.addEventListener( 'pointerdown', ( e ) => { dragging = true; resizer.classList.add( 'dragging' ); resizer.setPointerCapture( e.pointerId ); } );
    resizer.addEventListener( 'pointermove', ( e ) => { if ( dragging ) document.documentElement.style.setProperty( '--sidebar-width', Math.min( window.innerWidth - 100, Math.max( 100, e.clientX ) ) + 'px' ); } );
    resizer.addEventListener( 'pointerup', () => {
      dragging = false; resizer.classList.remove( 'dragging' );
      const w = getComputedStyle( document.documentElement ).getPropertyValue( '--sidebar-width' ).trim();
      try { localStorage.setItem( storageKey( 'sidebarWidth' ), w ); } catch ( _ ) { /* storage off */ }
    } );
  }
};
