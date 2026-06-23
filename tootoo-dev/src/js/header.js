/* TooToo — header.js  (the "where are we?" component).
   Ported from reference §8 (updateHeaderFromConfig) + appearance controls (§11).
   Reads: CONFIG + meta[revised]. Writes: state.owner/repo/branch (repo/branch
   pickers not built yet). Depends on globals CONFIG/state. */

// Header title tooltip. Prefers the VIEWED repo's last-push date (set by
// getDefaultBranch) so a dropped-in copy reflects that repo, not this file's static
// build date; falls back to meta[revised] before the repo loads / if the API fails.
const setHeaderTimestamp = () => {
  const titleEl = document.getElementById( 'headerTitle' );
  if ( !titleEl ) return;
  let when;
  if ( state.repoUpdated ) {
    const d = new Date( state.repoUpdated );
    when = isNaN( d.getTime() ) ? state.repoUpdated : d.toLocaleString();
  } else {
    when = document.querySelector( 'meta[name="revised"]' )?.content || 'unknown';
  }
  titleEl.title = `Last updated: ${ when } · click to reload`;
};

const updateHeaderFromConfig = () => {
  if ( CONFIG.themeColor ) document.documentElement.style.setProperty( '--highlight-color', CONFIG.themeColor );
  // Once a repo is known, the header shows owner / repo; appName is the fallback
  // shown only before detection (reference §8 uses APP_ORIGIN for the same effect).
  const label = ( state.owner && state.repo ) ? `${ state.owner } / ${ state.repo }` : CONFIG.appName;
  const titleEl = document.getElementById( 'headerTitle' );
  document.title = CONFIG.subtitle ? `${ label } · ${ CONFIG.subtitle }` : label;
  titleEl.textContent = label;
  setHeaderTimestamp();
  if ( CONFIG.subtitle ) {
    const sub = document.createElement( 'span' );
    sub.style.cssText = 'opacity: 0.6; font-weight: normal; margin-left: 0.4rem; font-size: 0.9rem;';
    sub.textContent = '· ' + CONFIG.subtitle;
    titleEl.appendChild( sub );
  }
};

/* Header owns the sidebar toggle (Ctrl/⌘ B + the ☰ button both call this). */
const updateSidebarToggle = ( hidden ) => {
  const btn = document.getElementById( 'btnToggleSidebar' );
  if ( !btn ) return;
  btn.setAttribute( 'aria-expanded', String( !hidden ) );
  btn.title = hidden ? 'Open sidebar (Ctrl/⌘ B)' : 'Close sidebar (Ctrl/⌘ B)';
};
const toggleSidebar = () => {
  const hidden = document.body.classList.toggle( 'sidebar-hidden' );
  updateSidebarToggle( hidden );
  try { localStorage.setItem( storageKey( 'sidebarHidden' ), hidden ); } catch ( _ ) { /* storage off */ }
};

const initHeaderControls = () => {
  document.getElementById( 'btnDarkMode' )?.addEventListener( 'click', ( e ) => {
    const isDark = document.body.classList.toggle( 'dark-mode' );
    e.currentTarget.textContent = isDark ? '☀️' : '🌙';
    setHljsTheme( isDark );
    try { localStorage.setItem( storageKey( 'darkMode' ), isDark ); } catch ( _ ) { /* storage off */ }
  } );

  // Font size: read the live value, step ±2 (10–36), persist, and show the
  // current size in the A−/A+ tooltips.
  const getFontSize = () => parseInt( getComputedStyle( document.documentElement ).getPropertyValue( '--font-size' ), 10 ) || 16;
  const updateFontTitles = ( sz ) => {
    const dec = document.getElementById( 'btnFontDec' );
    const inc = document.getElementById( 'btnFontInc' );
    if ( dec ) dec.title = `Decrease text size — currently ${ sz }px`;
    if ( inc ) inc.title = `Increase text size — currently ${ sz }px`;
  };
  const setFont = ( sz ) => {
    document.documentElement.style.setProperty( '--font-size', sz + 'px' );
    try { localStorage.setItem( storageKey( 'fontSize' ), sz + 'px' ); } catch ( _ ) { /* storage off */ }
    updateFontTitles( sz );
  };
  document.getElementById( 'btnFontDec' )?.addEventListener( 'click', () => setFont( Math.max( getFontSize() - 2, 10 ) ) );
  document.getElementById( 'btnFontInc' )?.addEventListener( 'click', () => setFont( Math.min( getFontSize() + 2, 36 ) ) );
  updateFontTitles( getFontSize() );   // seed the tooltips with the current size

  document.getElementById( 'btnHelp' )?.addEventListener( 'click', () => toggleInfoPanel( 'about' ) );
  document.getElementById( 'btnToken' )?.addEventListener( 'click', () => toggleInfoPanel( 'token' ) );
  document.getElementById( 'btnToggleSidebar' )?.addEventListener( 'click', toggleSidebar );

  // Header title → reset to the home repo: clear hash/query, cached repo, last file.
  document.getElementById( 'headerTitle' )?.addEventListener( 'click', ( e ) => {
    e.preventDefault();
    clearCurrentFile();
    try { localStorage.removeItem( repoCacheKey() ); } catch ( _ ) { /* storage off */ }
    if ( location.search || location.hash ) location.replace( location.pathname );
    else location.reload();
  } );

  document.getElementById( 'headerGitHub' )?.setAttribute( 'href', CONFIG.sourceRepoUrl || '#' );
};

/* ── token panel (header owns the dialog; it renders into the content area) ── */
const showTokenPanel = () => {
  const cb = document.getElementById( 'contentBody' );
  if ( !cb ) return;   // standalone header page has no content area
  const hasToken = getToken().length > 0;
  setContentHeader( makeSimpleHeader( 'GitHub Token' ) );
  cb.innerHTML = `
    <div class="markdown-body">
      <p>${ escapeHTML( CONFIG.appName ) } reads the GitHub API — <strong>60 requests/hour</strong> anonymous, <strong>5,000/hour</strong> with a token. The token is stored only in this browser's <code>localStorage</code> and sent only to <code>api.github.com</code>.</p>
      <p><a href="https://github.com/settings/tokens" target="_blank" rel="noopener">Create a token →</a> — a classic token with no scopes is enough for public repos.</p>
      <div class="repo-form">
        <label for="inpToken">Token${ hasToken ? ' (currently set)' : '' }</label>
        <input id="inpToken" type="password" placeholder="${ hasToken ? '•••••• (blank = keep)' : 'ghp_…' }" autocomplete="off" spellcheck="false">
        <label><input id="inpTokenShow" type="checkbox"> Show token</label>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button id="btnTokenSave" class="primary">Save</button>
          <button id="btnTokenClear" class="secondary">Clear</button>
        </div>
      </div>
      <hr style="margin:1rem 0;border:none;border-top:1px solid var(--border-color);">
      <p style="font-size:0.85rem;opacity:0.8;">Wipe every preference, cached file, and the token from this browser — useful when testing.</p>
      <button id="btnResetAll" class="secondary">Reset all data</button>
    </div>`;
  const inp = document.getElementById( 'inpToken' );
  inp.focus();
  document.getElementById( 'inpTokenShow' ).addEventListener( 'change', ( e ) => { inp.type = e.target.checked ? 'text' : 'password'; } );
  const save = () => {
    const v = inp.value;
    if ( v === '' && hasToken ) return;   // blank = keep existing
    try { localStorage.setItem( tokenStorageKey(), v ); } catch ( _ ) { /* storage disabled */ }
    clearFileCache();
    location.reload();
  };
  document.getElementById( 'btnTokenSave' ).addEventListener( 'click', save );
  inp.addEventListener( 'keydown', ( e ) => { if ( e.key === 'Enter' ) save(); } );
  document.getElementById( 'btnTokenClear' ).addEventListener( 'click', () => {
    try { localStorage.removeItem( tokenStorageKey() ); } catch ( _ ) { /* storage disabled */ }
    clearFileCache();
    location.reload();
  } );
  document.getElementById( 'btnResetAll' )?.addEventListener( 'click', () => {
    if ( !window.confirm( `Wipe all ${ CONFIG.appName } data from this browser?` ) ) return;
    try {
      const prefix = `${ CONFIG.storagePrefix }-lab:`;
      const keys = [];
      for ( let i = 0; i < localStorage.length; i++ ) { const k = localStorage.key( i ); if ( k && k.startsWith( prefix ) ) keys.push( k ); }
      for ( const k of keys ) localStorage.removeItem( k );
    } catch ( _ ) { /* storage disabled */ }
    clearFileCache();
    location.reload();
  } );
};

/* ── About panel + About/Token toggle (reference §12c). ? / ⚙️ open their panel;
   clicking again returns to the file you were on (panelReturnPath). ── */
let activePanel = null;       // 'about' | 'token' | null
let panelReturnPath = '';

const updateInfoButtonState = () => {
  const help = document.getElementById( 'btnHelp' );
  const token = document.getElementById( 'btnToken' );
  help?.classList.toggle( 'active', activePanel === 'about' );
  help?.setAttribute( 'aria-pressed', String( activePanel === 'about' ) );
  token?.classList.toggle( 'active', activePanel === 'token' );
  token?.setAttribute( 'aria-pressed', String( activePanel === 'token' ) );
};

const renderAboutPanel = async () => {
  const revised = document.querySelector( 'meta[name="revised"]' )?.content || 'unknown';
  const sourceUrl = CONFIG.sourceRepoUrl;
  const repoUrl = state.owner && state.repo ? `https://github.com/${ state.owner }/${ state.repo }` : sourceUrl;
  const tokenStatus = getToken() ? 'Set' : 'Not set (anonymous — 60 requests/hour)';

  let rateLimitInfo = 'Unable to fetch';
  try {
    const res = await fetch( 'https://api.github.com/rate_limit', { headers: ghHeaders() } );
    if ( res.ok ) { const core = ( await res.json() ).resources.core; rateLimitInfo = `${ core.remaining } / ${ core.limit } remaining`; }
  } catch ( _ ) { /* offline */ }

  const branchHtml = ( state.owner && state.repo && state.branch )
    ? `<li><strong>Branch:</strong> <a href="https://github.com/${ encodeURIComponent( state.owner ) }/${ encodeURIComponent( state.repo ) }/tree/${ encodeURIComponent( state.branch ) }" target="_blank" rel="noopener">${ escapeHTML( state.branch ) }</a></li>`
    : '';

  const statsHtml = ( () => {
    const stats = getRepoStats();
    if ( !stats ) return '<h3>Repository statistics</h3><p>No tree loaded yet.</p>';
    const types = stats.topTypes.map( ( [ ext, n ] ) => `<li>${ escapeHTML( ext ) }: ${ n }</li>` ).join( '' );
    const largest = stats.largest.map( ( f ) => `<li>${ escapeHTML( f.path ) } — ${ formatFileSize( f.size ) }</li>` ).join( '' );
    return `<h3>Repository statistics</h3><ul><li><strong>Files:</strong> ${ stats.fileCount }</li><li><strong>Folders:</strong> ${ stats.folderCount }</li><li><strong>Total size:</strong> ${ formatFileSize( stats.totalSize ) }</li></ul><h4>Top file types</h4><ol>${ types }</ol><h4>Largest files</h4><ol>${ largest }</ol>`;
  } )();

  setContentHeader( makeSimpleHeader( 'About' ) );
  document.getElementById( 'contentBody' ).innerHTML = `
    <div class="markdown-body">
      <h2>${ escapeHTML( CONFIG.appName ) }</h2>
      <p>A lightweight single-file GitHub repository browser (component build).</p>
      <ul>
        <li><strong>Source:</strong> <a href="${ escapeHTML( sourceUrl ) }" target="_blank" rel="noopener">${ escapeHTML( sourceUrl ) }</a></li>
        <li><strong>Repository:</strong> <a href="${ escapeHTML( repoUrl ) }" target="_blank" rel="noopener">${ escapeHTML( repoUrl ) }</a></li>
        ${ branchHtml }
        <li><strong>Updated:</strong> ${ escapeHTML( revised ) }</li>
        <li><strong>Token:</strong> ${ escapeHTML( tokenStatus ) }</li>
        <li><strong>Rate limit:</strong> ${ escapeHTML( rateLimitInfo ) }</li>
      </ul>
      ${ statsHtml }
      <h3>Keyboard shortcuts</h3>
      <ul>
        <li><kbd>Ctrl/⌘ B</kbd> — toggle sidebar</li>
        <li><kbd>/</kbd> focus filter · <kbd>Esc</kbd> clear filter</li>
        <li><kbd>↑</kbd> <kbd>↓</kbd> move · <kbd>→</kbd>/<kbd>←</kbd> open/close folder · <kbd>Enter</kbd> open</li>
      </ul>
      <h3>Maintenance</h3>
      <button id="btnSelfTest" class="secondary">🧪 Run self-test</button>
    </div>`;
  document.getElementById( 'btnSelfTest' )?.addEventListener( 'click', runSelfTest );
};

const closeInfoPanel = () => {
  activePanel = null;
  updateInfoButtonState();
  const path = panelReturnPath;
  panelReturnPath = '';
  if ( path && state.tree?.some( ( i ) => i.path === path && i.type === 'blob' ) ) selectFile( path );
  else autoSelectReadme();
};

const toggleInfoPanel = async ( panel ) => {
  if ( activePanel === panel ) { closeInfoPanel(); return; }
  if ( !activePanel ) panelReturnPath = state.currentFilePath || '';
  activePanel = panel;
  updateInfoButtonState();
  if ( panel === 'about' ) await renderAboutPanel();
  else showTokenPanel();
};

/* Restore persisted appearance (reference §11 initAppearance): dark mode (else OS
   preference), font size, sidebar width (+ narrow default), theme color, collapse. */
const initAppearance = () => {
  const stored = localStorage.getItem( storageKey( 'darkMode' ) );
  const isDark = stored === null ? window.matchMedia( '(prefers-color-scheme: dark)' ).matches : stored === 'true';
  if ( isDark ) {
    document.body.classList.add( 'dark-mode' );
    const b = document.getElementById( 'btnDarkMode' ); if ( b ) b.textContent = '☀️';
  }
  setHljsTheme( isDark );

  const savedFont = localStorage.getItem( storageKey( 'fontSize' ) );
  if ( savedFont ) document.documentElement.style.setProperty( '--font-size', savedFont );

  const savedWidth = localStorage.getItem( storageKey( 'sidebarWidth' ) );
  if ( savedWidth ) document.documentElement.style.setProperty( '--sidebar-width', savedWidth );
  else if ( window.innerWidth <= 768 ) document.documentElement.style.setProperty( '--sidebar-width', Math.round( window.innerWidth * 0.25 ) + 'px' );

  if ( CONFIG.themeColor ) {
    document.documentElement.style.setProperty( '--highlight-color', CONFIG.themeColor );
    document.body.style.setProperty( '--highlight-color', CONFIG.themeColor );
  }

  const hidden = localStorage.getItem( storageKey( 'sidebarHidden' ) ) === 'true';
  document.body.classList.toggle( 'sidebar-hidden', hidden );
  updateSidebarToggle( hidden );
};

const initHeader = () => { updateHeaderFromConfig(); initAppearance(); initHeaderControls(); };
