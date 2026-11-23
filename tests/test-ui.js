// test-ui.js: Stage 3, the Browser view over the mock: shell, tree and content.

// The next time `name` is emitted with a detail that passes `check`.
const nextEvent = ( name, check = () => true ) => new Promise( ( resolve ) => {
  const listener = ( detail ) => { if ( check( detail ) ) { Events.off( name, listener ); resolve( detail ); } };
  Events.on( name, listener );
} );

// Mounts the view on the mock, off screen (rendered, so rows can take focus).
const mountMock = async ( source = MockSource ) => {
  const box = document.createElement( 'div' );
  box.style.cssText = 'position: absolute; left: -10000px; top: 0; width: 900px; height: 600px;';
  document.body.append( box );
  await BrowserView.mount( box, { source, repo: { owner: 'mock', repo: 'mock-repo', branch: '' } } );
  const find = ( selector ) => box.querySelector( selector );
  const done = () => {
    BrowserView.unmount();
    box.remove();
    history.replaceState( null, '', location.pathname + location.search );
    document.title = 'TooToo tests';
  };
  return { box, find, done };
};

const names = ( nodes ) => nodes.map( ( node ) => node.name );
const press = ( key, options = {} ) => document.activeElement.dispatchEvent( new KeyboardEvent( 'keydown', { key, bubbles: true, cancelable: true, ...options } ) );

// ── Tree rules (pure) ──

test( 'tree: folders first, then README, then files; hidden rules applied', async () => {
  const items = await MockSource.listTree();
  const nodes = Tree.build( items, { ...CONFIG, hiddenFolders: [ 'Images' ] } );
  assertEqual( names( nodes ), [ 'blog', 'code', 'data', 'docs', 'media', 'pages', 'README.md', 'notes.txt' ] );
  assertEqual( names( nodes.find( ( node ) => node.name === 'docs' ).children ), [ 'README.md', 'guide.md', 'paper.pdf' ] );
  assert( names( Tree.build( items ) ).includes( 'Images' ), 'Images shows when not hidden' );
} );

test( 'tree: blog mode sorts months, years and posts newest first', async () => {
  const blog = Tree.build( await MockSource.listTree() ).find( ( node ) => node.name === 'blog' );
  assertEqual( blog.mode, 'blog' );
  assertEqual( names( blog.children ), [ '11-November', '06-June', '2025' ] );
  assertEqual( names( blog.children[ 0 ].children ), [ '2026-11-20-latest.md', '2026-11-02-first.md' ] );
  assertEqual( Tree.latestPost( blog ), 'blog/11-November/2026-11-20-latest.md' );
} );

test( 'tree: what is hidden', () => {
  const show = ( path, config = {}, type = 'file' ) => Tree.isVisible( { path, type }, { ...CONFIG, ...config } );
  assertEqual( [ show( '.github/x.yml' ), show( 'docs/.env' ), show( '.github', {}, 'folder' ) ], [ false, false, false ], 'dot names:' );
  assertEqual( [ show( 'Images/a.png', { hiddenFolders: [ 'images' ] } ), show( 'docs/IMAGES', { hiddenFolders: [ 'images' ] }, 'folder' ) ],
    [ false, false ], 'hidden folders, any depth, any case:' );
  assertEqual( [ show( 'a/secret.md', { hiddenFiles: [ 'secret.md' ] } ), show( 'index.html', { hiddenFiles: [ '/index.html' ] } ),
    show( 'sub/index.html', { hiddenFiles: [ '/index.html' ] } ) ], [ false, false, true ], 'hidden files; "/" anchors to the root:' );
  assertEqual( [ show( 'index.bak', { hiddenFiles: [ 'other.md' ] } ), show( 'sub/index.bak' ) ], [ false, false ], 'index.bak always:' );
  assertEqual( [ show( 'notes-2026-11-21-08-30.md' ), show( 'README 2026 09 18.md' ), show( '2026-01-04-essay.md' ),
    show( 'notes-2026-11-21-08-30.md', { hideDatedBackups: false } ) ], [ false, false, true, true ], 'dated backups:' );
} );

test( 'tree: the root README is the shortest README name', () => {
  const items = [ 'README RFP.md', 'README.md', 'docs/README.md', 'readme-old-2026-01-01.md' ].map( ( path ) => ( { path, type: 'file' } ) );
  assertEqual( Tree.readmeIn( '', items ), 'README.md' );
  assertEqual( Tree.readmeIn( 'docs', items ), 'docs/README.md' );
  assertEqual( Tree.readmeIn( 'none', items ), '' );
} );

test( 'shell: the rights line follows rightsOwners', () => {
  const line = ( owner, rightsOwners ) => Shell.rightsLine( owner, { ...CONFIG, rightsOwners }, 2026 );
  assertEqual( line( 'mock', null ), '© 2026 mock · No rights reserved' );
  assertEqual( line( 'Mock', [ 'mock' ] ), '© 2026 Mock · No rights reserved' );
  assertEqual( line( 'mock', [ 'someone-else' ] ), '© 2026 mock' );
  assertEqual( line( 'mock', [] ), '© 2026 mock' );
  assertEqual( line( '', null ), '' );
} );

test( 'shell: the title links (SPEC §6 Header)', () => {
  assertEqual( Shell.titleLinks( 'pushme-pullyou', 'tootoo-next' ), {
    github: 'https://github.com/pushme-pullyou/tootoo-next',
    home: 'https://pushme-pullyou.github.io/',
    pages: 'https://pushme-pullyou.github.io/tootoo-next/',
  } );
  assertEqual( Shell.titleLinks( 'Theo-Armour', 'theo-armour.github.io' ).pages, '', 'the site repo has no repo link:' );
  assertEqual( Shell.titleLinks( 'Theo-Armour', 'theo-armour.github.io' ).home, 'https://theo-armour.github.io/' );
  assertEqual( Shell.titleLinks( '', '' ), { github: '', home: '', pages: '' } );
} );

test( 'shell: the app name is hidden when it repeats the repo name', () => {
  assertEqual( [ Shell.sameName( 'TooToo Next', 'tootoo-next' ), Shell.sameName( 'Pages', 'theo-armour.github.io' ),
    Shell.sameName( 'TooToo', 'mock-repo' ), Shell.sameName( '', '' ) ], [ true, false, false, false ] );
} );

test( 'content: the file on GitHub (SPEC §6 File header)', () => {
  assertEqual( Content.githubUrl( 'pushme-pullyou', 'tootoo-next', '', 'docs/my notes.md' ),
    'https://github.com/pushme-pullyou/tootoo-next/blob/HEAD/docs/my%20notes.md' );
  assertEqual( Content.githubUrl( 'o', 'r', 'feature/x', 'a.md' ), 'https://github.com/o/r/blob/feature/x/a.md', 'a branch with a slash:' );
  assertEqual( Content.githubUrl( '', '', '', 'a.md' ), '', 'no repo, no link:' );
} );

// ── The mounted view ──

test( 'view: mounts on the mock and opens the README', async () => {
  const view = await mountMock();
  assertEqual( view.find( '.app-name' ).textContent, 'TooToo' );
  assertEqual( view.find( '.repo-links' ).textContent, 'mock / mock-repo' );
  assertEqual( [ ...view.find( '.app-header' ).querySelectorAll( '.icon-link, .repo-links a, .brand' ) ].map( ( link ) => link.getAttribute( 'href' ) ),
    [ 'https://github.com/mock/mock-repo', 'https://mock.github.io/', 'https://mock.github.io/mock-repo/', location.pathname ], 'icon, owner, repo, app name:' );
  assert( view.find( '.icon-link svg' ), 'the GitHub mark when faviconFile is empty' );
  assert( ! view.find( '.brand' ).hidden, 'TooToo differs from mock-repo, so the app name shows' );
  assert( view.find( '.app-footer' ).textContent.startsWith( '© ' ), 'no footer' );
  assertEqual( state.currentPath, 'README.md' );
  assertEqual( view.find( '.file-body h1' ).textContent, 'Mock repo', 'README rendered:' );
  assertEqual( view.find( '.tree-count' ).textContent, '17 files' );
  assert( ! view.find( '.tree' ).textContent.includes( 'index.bak' ), 'index.bak should be hidden' );
  assertEqual( location.hash, '#README.md' );
  view.done();
} );

test( 'view: selecting a file emits file-selected, then file-rendered', async () => {
  const view = await mountMock();
  const seen = [];
  const selected = ( detail ) => seen.push( [ 'file-selected', detail.path ] );
  const rendered = ( detail ) => seen.push( [ 'file-rendered', detail.path ] );
  Events.on( 'file-selected', selected );
  Events.on( 'file-rendered', rendered );
  await Content.open( 'docs/guide.md' );
  Events.off( 'file-selected', selected );
  Events.off( 'file-rendered', rendered );
  assertEqual( seen, [ [ 'file-selected', 'docs/guide.md' ], [ 'file-rendered', 'docs/guide.md' ] ] );
  assertEqual( view.find( '.breadcrumbs' ).textContent.trim(), 'docs / guide.md', 'no repo name first:' );
  assertEqual( view.find( '.breadcrumbs .github-link' ).getAttribute( 'href' ), 'https://github.com/mock/mock-repo/blob/HEAD/docs/guide.md', 'the file on GitHub:' );
  assert( view.find( '.breadcrumbs a[href="#docs/README.md"]' ), 'docs links to its README' );
  assertEqual( view.find( '.tree-item.active' ).dataset.path, 'docs/guide.md' );
  assert( view.find( 'details[data-path="docs"]' ).open, 'docs opened to show the active file' );
  view.done();
} );

test( 'view: a deep link opens the file', async () => {
  const view = await mountMock();
  const rendered = nextEvent( 'file-rendered', ( detail ) => detail.path === 'data/table.csv' );
  location.hash = 'data/table.csv#top';
  await rendered;
  assertEqual( state.currentPath, 'data/table.csv' );
  assertEqual( view.find( '.file-body td' ).textContent, 'apples', 'CSV table shown:' );
  view.done();
} );

test( 'view: a missing file says so', async () => {
  const view = await mountMock();
  await Content.open( 'no/such.md' );
  assertEqual( view.find( '.file-body' ).textContent, 'Not found: no/such.md' );
  view.done();
} );

test( 'view: the filter finds names with hyphens or spaces, and Escape restores the tree', async () => {
  const view = await mountMock();
  const filter = view.find( '.tree-filter' );
  const shown = () => [ ...view.box.querySelectorAll( '.tree-item:not(.is-hidden)' ) ].filter( Tree.isShown ).map( ( item ) => item.dataset.path );
  assert( Tree.matches( '2025-12-01-last-year.md', 'Last Year' ) && Tree.matches( '2025-12-01-last-year.md', 'last-year' ), 'matches' );
  filter.value = 'last year';
  filter.dispatchEvent( new Event( 'input' ) );
  assertEqual( shown(), [ 'blog/2025/2025-12-01-last-year.md' ] );
  assertEqual( view.find( '.tree-count' ).textContent, '1 match' );
  filter.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Escape' } ) );
  assertEqual( view.find( '.tree-count' ).textContent, '17 files' );
  assert( ! view.find( 'details[data-path="blog"]' ).open, 'blog closes again' );
  view.done();
} );

test( 'view: keyboard moves through the tree and opens files', async () => {
  const view = await mountMock();
  const rowText = () => document.activeElement.textContent.trim();
  view.find( '.tree summary' ).focus();
  assertEqual( rowText(), '📁 blog' );
  press( 'ArrowDown' );
  assertEqual( rowText(), '📁 code' );
  press( 'ArrowRight' );
  assert( view.find( 'details[data-path="code"]' ).open, 'ArrowRight opens the folder' );
  const rendered = nextEvent( 'file-rendered', ( detail ) => detail.path === 'code/app.js' );
  press( 'ArrowDown' );
  assertEqual( document.activeElement.dataset.path, 'code/app.js' );
  await rendered;
  press( 'ArrowLeft' );
  assertEqual( rowText(), '📁 code', 'ArrowLeft goes to the folder:' );
  press( 'ArrowLeft' );
  assert( ! view.find( 'details[data-path="code"]' ).open, 'ArrowLeft closes the folder' );
  press( 'End' );
  assertEqual( document.activeElement.dataset.path, 'notes.txt' );
  press( '/' );
  assertEqual( document.activeElement, view.find( '.tree-filter' ) );
  press( '\\' );
  assert( view.find( '.tree' ).contains( document.activeElement ), '\\ goes back to the tree' );
  // Narrow windows start collapsed, so check that Ctrl+B flips the state, whatever it was.
  const hidden = () => view.box.classList.contains( 'sidebar-hidden' );
  const before = hidden();
  press( 'b', { ctrlKey: true } );
  assertEqual( hidden(), ! before, 'Ctrl+B flips the files:' );
  press( 'b', { ctrlKey: true } );
  assertEqual( hidden(), before, 'and back:' );
  view.done();
} );

test( 'view: on file://, a folder picked in the start panel replaces the panel with its README', async () => {
  // The real startup path (no source given), with a fake picker that returns fakeClone() from test-sources.js.
  if ( location.protocol !== 'file:' ) { return; }   // the start panel only shows on file:// (the suite also runs on Pages)
  const picker = window.showDirectoryPicker;
  window.showDirectoryPicker = async () => fakeClone();
  const box = document.createElement( 'div' );
  box.style.cssText = 'position: absolute; left: -10000px; top: 0; width: 900px; height: 600px;';
  document.body.append( box );
  try {
    const mounted = BrowserView.mount( box );
    await waitFor( () => box.querySelector( '.start-panel button' ) );
    [ ...box.querySelectorAll( '.start-panel button' ) ].find( ( button ) => button.textContent.includes( 'Open folder' ) ).click();
    await mounted;
    assertEqual( box.querySelector( '.file-body h1' ) && box.querySelector( '.file-body h1' ).textContent, 'Pages', 'README shown:' );
    assert( ! box.querySelector( '.start-panel' ), 'the start panel is gone' );
    assert( ! box.querySelector( '.file-header' ).hidden, 'the file header shows' );
    assertEqual( box.querySelector( '.repo-links' ).textContent, '📂 theo-armour / pages', 'a clone: 📂, then owner / repo:' );
    const github = box.querySelector( '.breadcrumbs .github-link' );
    assertEqual( [ github.getAttribute( 'href' ), github.title ],
      [ 'https://github.com/theo-armour/pages/blob/main/README.md', 'On GitHub (may differ from your local copy)' ], 'a clone links to the pushed file:' );
  } finally {
    window.showDirectoryPicker = picker;
    BrowserView.unmount();
    box.remove();
    history.replaceState( null, '', location.pathname + location.search );
    document.title = 'TooToo tests';
  }
} );

test( 'view: a token error shows its message and opens the token panel', async () => {
  const failing = { ...MockSource, listTree: async () => { throw GitHub.errorFor( 'rate-limit' ); } };
  const view = await mountMock( failing );
  assert( view.find( '.file-body' ).textContent.includes( '60 requests an hour' ), 'no message' );
  assert( ! view.find( '.panel' ).hidden && view.find( '.panel .token-input' ), 'token panel not open' );
  view.done();
} );
