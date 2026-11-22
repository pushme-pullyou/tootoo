// content.js: the open file. A header with breadcrumbs and actions (raw ↔ rendered, copy,
// new tab, download), then the file itself, drawn by Loaders.render.
// Owns state.currentPath. Emits file-selected, then file-rendered.

const Content = {

  ticket: 0,   // counts opens, so a slow file can't replace a newer one

  // element: the box for the file view. Returns the unmount function.
  mount: ( element ) => {
    element.innerHTML = `
      <div class="file-header" hidden>
        <nav class="breadcrumbs" aria-label="Path"></nav>
        <span class="file-actions">
          <button type="button" data-action="toggle" hidden></button>
          <button type="button" data-action="copy" title="Copy the text">📋 Copy</button>
          <button type="button" data-action="tab" title="Open in a new tab">↗ New tab</button>
          <button type="button" data-action="download" title="Download the file">⬇ Download</button>
        </span>
      </div>
      <article class="file-body"></article>`;
    const find = ( selector ) => element.querySelector( selector );
    Content.el = { element, header: find( '.file-header' ), crumbs: find( '.breadcrumbs' ), toggle: find( '[data-action=toggle]' ), body: find( '.file-body' ) };
    Content.el.header.addEventListener( 'click', Content.onAction );
    Events.on( 'open-requested', Content.onOpenRequested );
    return () => Events.off( 'open-requested', Content.onOpenRequested );
  },

  // An empty hash means the start: the root README. A heading in the open file just scrolls.
  onOpenRequested: ( { path, heading } ) => {
    if ( ! state.tree ) { return; }   // too early (e.g. the start panel is up): the view opens the deep link after the tree loads
    if ( path && path === state.currentPath && heading ) { Content.scrollTo( heading ); return; }
    Content.open( path || Tree.readmeIn( '' ), heading );
  },

  showMessage: ( text ) => {
    Content.ticket += 1;
    Content.el.header.hidden = true;
    Content.el.body.innerHTML = `<p class="message">${ Shell.escape( text ) }</p>`;
  },

  // Raw or rendered, remembered per file type.
  isRaw: ( path ) => Shell.load( `raw:${ Loaders.extOf( path ) }` ) === true,

  open: async ( path, heading = '' ) => {
    const item = ( state.tree || [] ).find( ( entry ) => entry.path === path && entry.type === 'file' );
    if ( ! item ) {
      Content.showMessage( path ? `Not found: ${ path }` : 'No README here. Choose a file from the list.' );
      return;
    }
    Content.ticket += 1;
    const ticket = Content.ticket;
    state.currentPath = path;
    Content.syncHash( path, heading );
    Events.emit( 'file-selected', { path } );
    Content.renderHeader( path );
    const { body } = Content.el;
    body.innerHTML = '<p class="message">Loading…</p>';

    // Drawn off-page, then swapped in, so a slower earlier file never lands on top.
    const fresh = document.createElement( 'div' );
    const file = { path, name: path.split( '/' ).pop(), ext: Loaders.extOf( path ), size: item.size, source: state.source };
    const notice = ( text ) => { if ( ticket === Content.ticket ) { body.innerHTML = `<p class="message">${ Shell.escape( text ) }</p>`; } };
    try {
      await Loaders.render( file, fresh, { raw: Content.isRaw( path ), notice } );
    } catch ( error ) {
      fresh.innerHTML = `<p class="message">Couldn't show ${ Shell.escape( path ) }: ${ Shell.escape( error.message ) }</p>`;
    }
    if ( ticket !== Content.ticket ) { return; }
    body.replaceChildren( ...fresh.childNodes );
    Content.scrollTo( heading );
    Events.emit( 'file-rendered', { path } );
  },

  // Keeps the address bar on the open file, without a new history entry or a hashchange.
  syncHash: ( path, heading ) => {
    const current = Router.current();
    if ( current.path !== path || current.heading !== heading ) {
      history.replaceState( null, '', Router.build( { ...current, path, heading } ) );
    }
  },

  scrollTo: ( heading ) => {
    const target = heading && Content.el.body.querySelector( `#${ CSS.escape( heading ) }` );
    if ( target ) { target.scrollIntoView(); } else { ( Content.el.element.closest( '.content' ) || Content.el.element ).scrollTop = 0; }
  },

  // root / folder / … / file. A folder links to its own README when it has one.
  renderHeader: ( path ) => {
    const esc = Shell.escape;
    const parts = path.split( '/' );
    const rootName = ( state.source && state.source.folderName ) || state.repo || CONFIG.appName;
    const folders = parts.slice( 0, -1 ).map( ( part, i ) => {
      const readme = Tree.readmeIn( parts.slice( 0, i + 1 ).join( '/' ) );
      return readme ? `<a href="#${ esc( Router.encodePath( readme ) ) }">${ esc( part ) }</a>` : `<span>${ esc( part ) }</span>`;
    } );
    Content.el.crumbs.innerHTML = [ `<a href="#">${ esc( rootName ) }</a>`, ...folders, `<strong>${ esc( parts[ parts.length - 1 ] ) }</strong>` ].join( ' / ' );
    const { toggle } = Content.el;
    toggle.hidden = ! Loaders.canToggle( path );
    toggle.textContent = Content.isRaw( path ) ? '👁 Rendered' : '</> Raw';
    Content.el.header.querySelector( '[data-action=copy]' ).hidden = ! Loaders.isText( path );
    Content.el.header.hidden = false;
  },

  onAction: async ( event ) => {
    const button = event.target.closest( '[data-action]' );
    const path = state.currentPath;
    if ( ! button || ! path ) { return; }
    const action = button.dataset.action;
    try {
      if ( action === 'toggle' ) {
        Shell.save( `raw:${ Loaders.extOf( path ) }`, ! Content.isRaw( path ) );
        Content.open( path );
      }
      if ( action === 'copy' ) {
        await navigator.clipboard.writeText( await state.source.readText( path ) );
        button.textContent = '✔ Copied';
        setTimeout( () => { button.textContent = '📋 Copy'; }, 1500 );
      }
      if ( action === 'tab' ) { window.open( await state.source.fileUrl( path ), '_blank', 'noopener' ); }
      if ( action === 'download' ) {
        const link = document.createElement( 'a' );
        link.href = URL.createObjectURL( await state.source.readBlob( path ) );
        link.download = path.split( '/' ).pop();
        link.click();
        setTimeout( () => URL.revokeObjectURL( link.href ), 10000 );
      }
    } catch ( error ) {
      button.title = `Failed: ${ error.message }`;
    }
  },

};
