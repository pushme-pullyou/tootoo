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
  if ( CONFIG.themeColor ) {
    document.documentElement.style.setProperty( '--highlight-color', CONFIG.themeColor );
    document.body?.style.setProperty( '--highlight-color', CONFIG.themeColor );
  }
  // Once a repo is known, the header shows owner / repo; appName is the fallback
  // shown only before detection (reference §8 uses APP_ORIGIN for the same effect).
  const label = ( state.owner && state.repo ) ? `${ state.owner } / ${ state.repo }` : CONFIG.appName;
  const titleEl = document.getElementById( 'headerTitle' );
  const subtitleEl = document.getElementById( 'headerSubtitle' );
  document.title = CONFIG.subtitle ? `${ label } · ${ CONFIG.subtitle }` : label;
  // Render owner / repo as two nowrap segments so a narrow header can wrap at the
  // slash (either side) instead of forcing one long unbreakable line.
  if ( state.owner && state.repo ) {
    titleEl.innerHTML = `<span class="title-seg">${ escapeHTML( state.owner ) }</span> / <span class="title-seg">${ escapeHTML( state.repo ) }</span>`;
  } else {
    titleEl.textContent = CONFIG.appName;
  }
  setHeaderTimestamp();
  if ( subtitleEl ) {
    if ( CONFIG.subtitle ) {
      subtitleEl.textContent = '· ' + CONFIG.subtitle;
      subtitleEl.hidden = false;
    } else {
      subtitleEl.textContent = '';
      subtitleEl.hidden = true;
    }
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
const showTokenPanel = ( reasonHtml = '' ) => {
  const cb = document.getElementById( 'contentBody' );
  if ( !cb ) return;   // standalone header page has no content area
  const current = getToken();
  const hasToken = current.length > 0;
  setContentHeader( makeSimpleHeader( 'GitHub Token' ) );
  cb.innerHTML = `
    ${ reasonHtml }
    <div class="markdown-body">
      <div class="repo-form">
        <label for="inpToken">Token${ hasToken ? ' (currently set)' : '' }</label>
        <input id="inpToken" type="password" placeholder="${ hasToken ? '•••••••• (leave blank to keep)' : 'ghp_…' }" autocomplete="off" spellcheck="false">
        <label><input id="inpTokenShow" type="checkbox"> Show token</label>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button id="btnTokenSave" class="primary" title="Save token and reload">Save</button>
          <button id="btnTokenClear" class="secondary" title="Clear stored token">Clear</button>
        </div>
      </div>
      <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border-color);">
      <p>${ escapeHTML( CONFIG.appName ) } reads the GitHub REST API to list and fetch repository contents. GitHub limits anonymous (un-authenticated) access to <strong>60 requests per hour per IP address</strong>. Once you exceed that limit you cannot read more files until the limit resets, unless you provide a Personal Access Token (PAT). With a token the limit rises to <strong>5,000 requests per hour</strong>, and you can also access private repositories the token has read scope for.</p>
      <p><strong>Where do I get a token?</strong></p>
      <ul>
        <li><strong>Public repositories:</strong> create a token at <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">github.com/settings/tokens</a>. A classic token with no scopes is enough for read-only access, or use a fine-grained token.</li>
        <li><strong>Private repositories:</strong> ask the repository owner to issue a fine-grained personal access token scoped to that repository, with at minimum <em>Contents: Read</em> permission, and to share it with you securely.</li>
      </ul>
      <p>Your token is stored in this browser's <code>localStorage</code> only. It is never sent anywhere except <code>api.github.com</code>, and it is not shared with the developers of ${ escapeHTML( CONFIG.appName ) }.</p>
      <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border-color);">
      <p>Wipe every preference, cached file, and the GitHub token from this browser. Useful when testing a fork or starting fresh.</p>
      <button id="btnResetAll" class="secondary" title="Wipe all ${ escapeHTML( CONFIG.appName ) } data from this browser">Reset all ${ escapeHTML( CONFIG.appName ) } data</button>
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
    try {
      localStorage.removeItem( tokenStorageKey() );
    } catch ( _ ) { /* storage disabled */ }
    clearFileCache();
    location.reload();
  } );
  document.getElementById( 'btnResetAll' )?.addEventListener( 'click', () => {
    if ( !window.confirm( `Wipe all ${ CONFIG.appName } preferences, cached files, and the GitHub token from this browser?` ) ) return;
    try {
      const prefix = `${ CONFIG.storagePrefix }:`;
      const keys = [];
      for ( let i = 0; i < localStorage.length; i++ ) { const k = localStorage.key( i ); if ( k && k.startsWith( prefix ) ) keys.push( k ); }
      for ( const k of keys ) localStorage.removeItem( k );
    } catch ( _ ) { /* storage disabled */ }
    clearFileCache();
    location.reload();
  } );

  // Keep ⚙️ pressed-state and aria in sync even when this panel was opened
  // directly by an auth error path (not via toggleInfoPanel).
  activePanel = 'token';
  updateInfoButtonState();
};

const RATE_LIMIT_REASON_HTML = '<div class="error-panel">⚠️ <strong>GitHub API rate limit reached.</strong> You\'ve exceeded the anonymous request quota and cannot load more files until you add a token below or wait for the limit to reset.</div>';
const PRIVATE_REPO_MESSAGE = 'Repository not found. Double-check the owner, repository, and branch names for typos. If the repository is private, add a GitHub token with read access below.';
const privateRepoReasonHtml = () =>
  `<div class="error-panel">⚠️ <strong>Repository not found</strong> (GitHub returned 404). First, check the owner, repository, and branch names for a typo — that\'s the most common cause. If the repository really is private, add a GitHub access token with read access below. If you already have a token saved, make sure it covers ${ escapeHTML( state.owner ) }/${ escapeHTML( state.repo ) }.</div>`;

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
  const token = getToken();

  let rateLimitInfo = 'Unable to fetch';
  try {
    const res = await fetch( 'https://api.github.com/rate_limit', { headers: ghHeaders() } );
    if ( res.ok ) {
      const data = await res.json();
      const core = data.resources.core;
      const reset = new Date( core.reset * 1000 ).toLocaleTimeString();
      rateLimitInfo = `${ core.remaining } / ${ core.limit } remaining (resets at ${ reset })`;
    }
  } catch ( _ ) { /* offline or blocked */ }

  const tokenStatus = token ? 'Set' : 'Not set (anonymous — 60 requests/hour)';

  const branchHtml = ( state.owner && state.repo && state.branch )
    ? `<li><strong>Branch:</strong> <a href="https://github.com/${ encodeURIComponent( state.owner ) }/${ encodeURIComponent( state.repo ) }/tree/${ encodeURIComponent( state.branch ) }" target="_blank" rel="noopener">${ escapeHTML( state.branch ) }</a> · <a href="https://github.com/${ encodeURIComponent( state.owner ) }/${ encodeURIComponent( state.repo ) }/branches" target="_blank" rel="noopener">all branches</a></li>`
    : '';

  setContentHeader( makeSimpleHeader( 'About' ) );
  document.getElementById( 'contentBody' ).innerHTML = `
    <div class="markdown-body">
      <h2>${ escapeHTML( CONFIG.appName ) }</h2>
      <p>A lightweight single-file GitHub repository browser.</p>
      <ul>
        <li><strong>Source code:</strong> <a href="${ escapeHTML( sourceUrl ) }" target="_blank" rel="noopener">${ escapeHTML( sourceUrl ) }</a></li>
        <li><strong>Repository:</strong> <a href="${ escapeHTML( repoUrl ) }" target="_blank" rel="noopener">${ escapeHTML( repoUrl ) }</a></li>
        ${ branchHtml }
        <li><strong>Copyright:</strong> pushme-pullyou authors</li>
        <li><strong>License:</strong> See the repository's LICENSE file</li>
        <li><strong>Updated:</strong> ${ escapeHTML( revised ) }</li>
      </ul>
      <h3>GitHub API</h3>
      <ul>
        <li><strong>Repo visibility:</strong> Public (private repos require a token)</li>
        <li><strong>Token:</strong> ${ escapeHTML( tokenStatus ) }</li>
        <li><strong>Rate limit:</strong> ${ escapeHTML( rateLimitInfo ) }</li>
        <li><strong>GitHub Pages:</strong> Supported — auto-detects repos hosted on GitHub Pages</li>
      </ul>
      ${ ( () => {
      const stats = getRepoStats();
      if ( !stats ) return '<h3>Repository Statistics</h3><p>No tree data loaded yet.</p>';
      const typesHtml = stats.topTypes.map( ( [ ext, count ] ) =>
        `<li>${ escapeHTML( ext ) }: ${ count } file${ count !== 1 ? 's' : '' }</li>`
      ).join( '' );
      const largestHtml = stats.largest.map( ( f ) =>
        `<li>${ escapeHTML( f.path ) } — ${ formatFileSize( f.size ) }</li>`
      ).join( '' );
      return `<h3>Repository Statistics</h3>
              <ul>
                <li><strong>Files:</strong> ${ stats.fileCount }</li>
                <li><strong>Folders:</strong> ${ stats.folderCount }</li>
                <li><strong>Total size:</strong> ${ formatFileSize( stats.totalSize ) }</li>
              </ul>
              <h4>Top file types</h4>
              <ol>${ typesHtml }</ol>
              <h4>Largest files</h4>
              <ol>${ largestHtml }</ol>`;
    } )() }
      <h3>Tips</h3>
      <ul>
        <li>Use the filter input in the sidebar to search file names</li>
        <li>Click the title in the header to reload</li>
        <li>Use <strong>A−</strong> / <strong>A+</strong> to adjust font size — helpful on phones and small screens</li>
        <li>Click <strong>🌙</strong> to toggle dark mode — your choice is saved across visits</li>
        <li>Click <strong>?</strong> or <strong>⚙️ Token</strong> again to close the panel and return to your file</li>
      </ul>
      <h3>Keyboard shortcuts</h3>
      <ul>
        <li><kbd>Ctrl/⌘ B</kbd> — toggle sidebar</li>
        <li><kbd>/</kbd> — focus the filter box</li>
        <li><kbd>Esc</kbd> — clear the filter (when it's focused)</li>
        <li><kbd>\\</kbd> — focus the sidebar tree (jumps to the current selection)</li>
        <li><kbd>↑</kbd> <kbd>↓</kbd> — move one item up / down</li>
        <li><kbd>Home</kbd> <kbd>End</kbd> — jump to first / last visible item</li>
        <li><kbd>PgUp</kbd> <kbd>PgDn</kbd> — jump about one viewport</li>
        <li><kbd>→</kbd> — open folder / step into</li>
        <li><kbd>←</kbd> — close folder / step out</li>
        <li><kbd>Enter</kbd> <kbd>Space</kbd> — toggle folder or select file</li>
      </ul>
      <h3>Maintenance</h3>
      <p>Render every file in this repo off-screen and report which ones fail to display — markdown that won't parse, images that won't decode, spreadsheets that won't open. Best run locally (<code>file://</code>) or with a token.</p>
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
  // No content area to render into (e.g. the standalone header component page) →
  // the ?/⚙️ buttons are inert rather than throwing. Mirrors showTokenPanel's guard,
  // but here it also avoids leaving the button stuck pressed + a broken close path.
  if ( !document.getElementById( 'contentBody' ) ) return;
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
  // localStorage access THROWS when storage is blocked (cookies off, some private
  // modes) — a bare read here would abort the whole boot, so guard every read.
  const read = ( key ) => { try { return localStorage.getItem( storageKey( key ) ); } catch ( _ ) { return null; } };
  const stored = read( 'darkMode' );
  const isDark = stored === null ? window.matchMedia( '(prefers-color-scheme: dark)' ).matches : stored === 'true';
  if ( isDark ) {
    document.body.classList.add( 'dark-mode' );
    const b = document.getElementById( 'btnDarkMode' ); if ( b ) b.textContent = '☀️';
  }
  setHljsTheme( isDark );

  const savedFont = read( 'fontSize' );
  if ( savedFont ) document.documentElement.style.setProperty( '--font-size', savedFont );

  const savedWidth = read( 'sidebarWidth' );
  if ( savedWidth ) document.documentElement.style.setProperty( '--sidebar-width', savedWidth );
  else if ( window.innerWidth <= 768 ) document.documentElement.style.setProperty( '--sidebar-width', Math.round( window.innerWidth * 0.25 ) + 'px' );

  if ( CONFIG.themeColor ) {
    document.documentElement.style.setProperty( '--highlight-color', CONFIG.themeColor );
    document.body.style.setProperty( '--highlight-color', CONFIG.themeColor );
  }

  const hidden = read( 'sidebarHidden' ) === 'true';
  document.body.classList.toggle( 'sidebar-hidden', hidden );
  updateSidebarToggle( hidden );
};

const initHeader = () => { updateHeaderFromConfig(); initAppearance(); initHeaderControls(); };
