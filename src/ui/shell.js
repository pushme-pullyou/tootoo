// shell.js: the header, the footer, and the panels (About, GitHub token).
// Also the branding from CONFIG (theme color, heading font, icon, title) and the
// per-page preferences (dark mode, text size), saved in localStorage.

const Shell = {

  escape: ( text ) => String( text ).replace( /&/g, '&amp;' ).replace( /</g, '&lt;' )
    .replace( />/g, '&gt;' ).replace( /"/g, '&quot;' ),

  // ── Saved preferences, per page: '<storagePrefix>:<page path>:<name>'. Storage can be blocked. ──

  key: ( name ) => `${ CONFIG.storagePrefix }:${ location.pathname }:${ name }`,
  load: ( name ) => {
    try { return JSON.parse( localStorage.getItem( Shell.key( name ) ) ); } catch ( error ) { return null; }
  },
  save: ( name, value ) => {
    try { localStorage.setItem( Shell.key( name ), JSON.stringify( value ) ); } catch ( error ) { /* not saved */ }
  },

  release: () => ( document.querySelector( 'meta[name="tootoo-release"]' ) || {} ).content || 'dev',

  // ── Mount ──

  // elements: { header, footer, panel }. Returns the unmount function.
  mount: ( elements ) => {
    Shell.el = elements;
    Shell.applyBranding();
    elements.header.innerHTML = Shell.headerHtml();
    elements.header.addEventListener( 'click', Shell.onClick );
    elements.panel.addEventListener( 'click', Shell.onClick );
    Events.on( 'repo-changed', Shell.showRepo );
    Events.on( 'file-selected', Shell.showTitle );
    Shell.restorePrefs();
    Shell.showRepo();
    return () => {
      elements.header.removeEventListener( 'click', Shell.onClick );
      elements.panel.removeEventListener( 'click', Shell.onClick );
      Events.off( 'repo-changed', Shell.showRepo );
      Events.off( 'file-selected', Shell.showTitle );
    };
  },

  // The GitHub mark (Octicons, MIT), drawn in the text color: the icon when faviconFile isn't set.
  githubMark: `<svg class="brand-icon" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`,

  // The title, left to right (SPEC §6 Header): icon → the repo on GitHub, owner → their home page,
  // repo → its Pages site, app name → back to the start, subtitle. The links are filled in by showRepo.
  headerHtml: () => {
    const esc = Shell.escape;
    const icon = CONFIG.faviconFile ? `<img class="brand-icon" src="${ esc( CONFIG.faviconFile ) }" alt="">` : Shell.githubMark;
    const home = CONFIG.homeUrl ? `<a class="button" href="${ esc( CONFIG.homeUrl ) }" title="Home">⌂</a>` : '';
    return `
      <button class="sidebar-toggle" type="button" title="Show or hide the files (Ctrl+B)" aria-label="Show or hide the files">☰</button>
      <a class="icon-link">${ icon }</a>
      <span class="repo-links"></span>
      <a class="brand" href="${ esc( location.pathname ) }" title="Back to the start"><span class="app-name">${ esc( CONFIG.appName ) }</span></a>
      <span class="subtitle">${ esc( CONFIG.subtitle ) }</span>
      <span class="header-actions">
        ${ home }
        <button type="button" data-action="theme" title="Dark mode" aria-label="Dark mode">🌓</button>
        <button type="button" data-action="smaller" title="Smaller text" aria-label="Smaller text">A−</button>
        <button type="button" data-action="larger" title="Larger text" aria-label="Larger text">A+</button>
        <button type="button" data-action="token" title="GitHub token" aria-label="GitHub token">⚙️</button>
        <button type="button" data-action="about" title="About" aria-label="About">?</button>
      </span>`;
  },

  // ── Branding from CONFIG ──

  // Set on <body>, so an explicit theme color also wins over the dark-mode colors.
  applyBranding: () => {
    const body = document.body.style;
    if ( CONFIG.themeColor ) { body.setProperty( '--color-accent', CONFIG.themeColor ); }
    if ( CONFIG.headingFont ) { body.setProperty( '--font-heading', CONFIG.headingFont ); }
    const url = CONFIG.headingFontUrl;
    if ( url && /\.(woff2?|ttf|otf)([?#]|$)/i.test( url ) ) {
      // A font file: name it after the first family in headingFont.
      const family = ( CONFIG.headingFont || 'Heading' ).split( ',' )[ 0 ].trim().replace( /^["']|["']$/g, '' );
      const style = document.createElement( 'style' );
      style.textContent = `@font-face { font-family: "${ family }"; src: url("${ url }"); font-display: swap; }`;
      document.head.append( style );
    } else if ( url ) {
      document.head.insertAdjacentHTML( 'beforeend', `<link rel="stylesheet" href="${ Shell.escape( url ) }">` );
    }
    if ( CONFIG.faviconFile ) {
      document.head.insertAdjacentHTML( 'beforeend', `<link rel="icon" href="${ Shell.escape( CONFIG.faviconFile ) }">` );
    }
    document.title = CONFIG.appName;
  },

  showTitle: ( { path } ) => { document.title = `${ path.split( '/' ).pop() } · ${ CONFIG.appName }`; },

  // The three links for owner / repo. The owner's own site repo (<owner>.github.io) has no repo link.
  // Always the Pages addresses: checking whether a repo has Pages is for later.
  titleLinks: ( owner, repo ) => {
    if ( ! ( owner && repo ) ) { return { github: '', home: '', pages: '' }; }
    const home = `https://${ owner.toLowerCase() }.github.io/`;
    const isSiteRepo = repo.toLowerCase() === `${ owner.toLowerCase() }.github.io`;
    return {
      github: `https://github.com/${ encodeURIComponent( owner ) }/${ encodeURIComponent( repo ) }`,
      home,
      pages: isSiteRepo ? '' : `${ home }${ encodeURIComponent( repo ) }/`,
    };
  },

  // True when two names differ only in case, spaces or punctuation: 'TooToo Next' = 'tootoo-next'.
  sameName: ( a, b ) => {
    const plain = ( name ) => String( name || '' ).toLowerCase().replace( /[^a-z0-9]/g, '' );
    return plain( a ) !== '' && plain( a ) === plain( b );
  },

  // The header shows the app name only when the install names itself (not the default) and it isn't a repeat.
  showsAppName: ( ownName, shownName ) => Boolean( ownName ) && ! Shell.sameName( ownName, shownName ),

  // The icon's link, owner / repo links (📂 first for a local folder), then the footer.
  // The app name is left out when it only repeats the name just before it.
  showRepo: () => {
    const esc = Shell.escape;
    const header = Shell.el.header;
    const links = Shell.titleLinks( state.owner, state.repo );
    const iconLink = header.querySelector( '.icon-link' );
    if ( links.github ) {
      iconLink.href = links.github;
      iconLink.title = `${ state.owner }/${ state.repo } on GitHub`;
    } else {
      iconLink.removeAttribute( 'href' );   // no repo known: the icon links nowhere
      iconLink.removeAttribute( 'title' );
    }
    const local = ( state.source || {} ).name === 'local';
    const folder = local ? `<span title="A folder on this computer">📂</span> ` : '';
    let html = '';
    if ( links.home ) {
      html = `${ folder }<a href="${ esc( links.home ) }">${ esc( state.owner ) }</a>`;
      if ( links.pages ) { html += ` / <a href="${ esc( links.pages ) }">${ esc( state.repo ) }</a>`; }
    } else if ( local ) {
      html = `${ folder }${ esc( state.source.folderName ) }`;
    }
    header.querySelector( '.repo-links' ).innerHTML = html;
    const shownName = links.pages ? state.repo : links.home ? state.owner : '';
    header.querySelector( '.brand' ).hidden = ! Shell.showsAppName( ( window.TOOTOO_CONFIG || {} ).appName, shownName );
    Shell.el.footer.textContent = Shell.rightsLine( state.owner );
  },

  // '© 2026 owner · No rights reserved'. rightsOwners: null = every owner, a list = only those, [] = none.
  rightsLine: ( owner, config = CONFIG, year = new Date().getFullYear() ) => {
    if ( ! owner ) { return ''; }
    const owns = ! config.rightsOwners || config.rightsOwners.some( ( name ) => name.toLowerCase() === owner.toLowerCase() );
    return `© ${ year } ${ owner }${ config.rightsText && owns ? ` · ${ config.rightsText }` : '' }`;
  },

  // ── Preferences ──

  fontSize: 16,

  restorePrefs: () => {
    const dark = Shell.load( 'darkMode' );
    Shell.setDark( dark === null ? window.matchMedia( '(prefers-color-scheme: dark)' ).matches : dark, false );
    const size = Shell.load( 'fontSize' );
    if ( size ) { Shell.setFontSize( size, false ); }
  },

  setDark: ( dark, save = true ) => {
    document.body.classList.toggle( 'dark-mode', dark );
    if ( save ) { Shell.save( 'darkMode', dark ); }
    Events.emit( 'theme-changed', { dark } );
  },

  setFontSize: ( size, save = true ) => {
    Shell.fontSize = Math.min( 24, Math.max( 12, size ) );
    document.body.style.setProperty( '--font-size', `${ Shell.fontSize }px` );
    if ( save ) { Shell.save( 'fontSize', Shell.fontSize ); }
  },

  onClick: ( event ) => {
    const button = event.target.closest( '[data-action]' );
    const action = button && button.dataset.action;
    if ( action === 'theme' ) { Shell.setDark( ! document.body.classList.contains( 'dark-mode' ) ); }
    if ( action === 'smaller' ) { Shell.setFontSize( Shell.fontSize - 1 ); }
    if ( action === 'larger' ) { Shell.setFontSize( Shell.fontSize + 1 ); }
    if ( action === 'about' || action === 'token' ) { Shell.togglePanel( action ); }
    if ( action === 'close' ) { Shell.closePanel(); }
    if ( action === 'save-token' || action === 'remove-token' ) {
      const input = Shell.el.panel.querySelector( '.token-input' );
      GitHub.setToken( action === 'save-token' ? input.value.trim() : '' );
      location.reload();   // start again with the new token
    }
  },

  // ── Panels, shown above the file ──

  openPanel: ( name, reason = '' ) => {
    const panel = Shell.el.panel;
    panel.innerHTML = name === 'about' ? Shell.aboutHtml() : Shell.tokenHtml( reason );
    panel.dataset.open = name;
    panel.hidden = false;
  },

  closePanel: () => {
    Shell.el.panel.hidden = true;
    Shell.el.panel.dataset.open = '';
  },

  togglePanel: ( name ) => ( Shell.el.panel.dataset.open === name ? Shell.closePanel() : Shell.openPanel( name ) ),

  aboutHtml: () => {
    const esc = Shell.escape;
    const files = ( state.tree || [] ).filter( ( item ) => item.type === 'file' ).length;
    const source = state.source || {};
    const where = source.name === 'local' ? `the folder 📂 ${ esc( source.folderName ) }`
      : state.owner ? `<a href="https://github.com/${ esc( state.owner ) }/${ esc( state.repo ) }">${ esc( state.owner ) }/${ esc( state.repo ) }</a>${ state.branch ? ` (${ esc( state.branch ) })` : '' }`
        : 'no repository yet';
    const unknown = Config.unknownKeys();
    return `<button type="button" class="panel-close" data-action="close" aria-label="Close">✕</button>
      <h2>${ esc( CONFIG.appName ) }</h2>
      ${ CONFIG.subtitle ? `<p>${ esc( CONFIG.subtitle ) }</p>` : '' }
      <p>Showing ${ where }: ${ files.toLocaleString() } files.</p>
      <p>TooToo release <strong>${ esc( Shell.release() ) }</strong> · <a href="${ esc( CONFIG.sourceRepoUrl ) }">source and updates</a></p>
      <p>Keys: <kbd>/</kbd> filter · <kbd>\\</kbd> tree · arrows move · <kbd>Ctrl</kbd>+<kbd>B</kbd> files</p>
      ${ unknown.length ? `<p>Settings this release ignores: ${ unknown.map( ( key ) => `<code>${ esc( key ) }</code>` ).join( ', ' ) }</p>` : '' }`;
  },

  tokenHtml: ( reason ) => `<button type="button" class="panel-close" data-action="close" aria-label="Close">✕</button>
    <h2>⚙️ GitHub token</h2>
    ${ reason ? `<p class="notice">${ Shell.escape( reason ) }</p>` : '' }
    <p>Without a token, GitHub allows 60 requests an hour. A token raises that to 5,000, and reads the private repos it has access to.
      It's saved in this browser only${ location.protocol === 'file:' ? ', where other local pages can read it too, so use a read-only token' : '' }.</p>
    <p><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Create a token on GitHub</a></p>
    <p><input type="password" class="token-input" autocomplete="off" aria-label="GitHub token"
      placeholder="${ GitHub.getToken() ? 'A token is saved. Paste a new one to replace it' : 'Paste a token' }">
      <button type="button" data-action="save-token" class="primary">Save</button>
      <button type="button" data-action="remove-token">Remove</button></p>`,

};
