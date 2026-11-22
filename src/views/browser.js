// browser.js: the Browser view (v1): the header, the file tree, the open file and the footer.
// It picks the source, loads the tree, and opens the deep link or the root README.

const BrowserView = {

  name: 'browser',

  layout: `
    <header class="app-header"></header>
    <div class="app-body">
      <nav class="sidebar" aria-label="Files">
        <div class="sidebar-top">
          <input class="tree-filter" type="search" placeholder="Filter files  ( / )" aria-label="Filter files">
          <span class="tree-count"></span>
        </div>
        <div class="tree"></div>
      </nav>
      <div class="resizer" role="separator" aria-orientation="vertical" title="Drag to resize"></div>
      <main class="content">
        <section class="panel" hidden></section>
        <div class="file-view"></div>
      </main>
    </div>
    <footer class="app-footer"></footer>`,

  // options.source and options.repo skip the choice (the tests use the mock this way).
  mount: async ( element, options = {} ) => {
    const find = ( selector ) => element.querySelector( selector );
    element.classList.add( 'browser-view' );
    element.innerHTML = BrowserView.layout;
    BrowserView.element = element;
    BrowserView.unmounts = [
      Shell.mount( { header: find( '.app-header' ), footer: find( '.app-footer' ), panel: find( '.panel' ) } ),
      Tree.mount( element ),
      Content.mount( find( '.file-view' ) ),
    ];
    const { source, repo } = options.source ? options : await BrowserView.chooseSource( find( '.file-view' ) );
    state.source = source;   // the view picks the source, so it owns state.source and state.tree
    Router.start( repo );
    await BrowserView.loadTree();
  },

  unmount: () => {
    BrowserView.unmounts.forEach( ( unmount ) => unmount() );
    BrowserView.element.innerHTML = '';
    BrowserView.element.classList.remove( 'browser-view', 'sidebar-hidden' );
  },

  loadScript: ( src ) => new Promise( ( resolve, reject ) => {
    const script = document.createElement( 'script' );
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject( new Error( `Could not load ${ src }` ) );
    document.head.append( script );
  } ),

  // → { source, repo }. On file:// the start panel asks first (decision 32).
  chooseSource: async ( element ) => {
    // The one debug hook: src/index.html?source=mock. The release build has no
    // <script src="core/config.js"> (it's inlined), so there it's ignored.
    const isSourcePage = Boolean( document.querySelector( 'script[src="core/config.js"]' ) );
    if ( isSourcePage && new URLSearchParams( location.search ).get( 'source' ) === 'mock' ) {
      await BrowserView.loadScript( '../tests/mock-source.js' );
      return { source: MockSource, repo: { owner: 'mock', repo: 'mock-repo', branch: '' } };
    }
    if ( location.protocol === 'file:' ) {
      const choice = await Local.showStartPanel( element );
      if ( choice.choice === 'local' ) {
        return { source: choice.source, repo: ( await Local.readGitRepo( choice.source ) ) || { owner: '', repo: '', branch: '' } };
      }
      return { source: GitHub, repo: choice.repo || GitHub.detectRepo() };
    }
    return { source: GitHub, repo: GitHub.detectRepo() };
  },

  loadTree: async () => {
    if ( state.source === GitHub && ! ( state.owner && state.repo ) ) {
      Content.showMessage( 'No repository chosen. Set owner and repo in the config block, or add ?owner=…&repo=… to the address.' );
      return;
    }
    Content.showMessage( 'Loading files…' );
    try {
      state.tree = await state.source.listTree();
    } catch ( error ) {
      Content.showMessage( error.message );
      if ( error.needsToken ) { Shell.openPanel( 'token', error.message ); }
      return;
    }
    Events.emit( 'tree-loaded', { tree: state.tree } );
    const { path, heading } = Router.current();
    await Content.open( path || Tree.readmeIn( '' ), heading );
  },

};
