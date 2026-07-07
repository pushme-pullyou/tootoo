/* TooToo — main.js  (init + wiring) for the ASSEMBLED live build.
   Init order per ARCHITECTURE.md: header → content → footer → detect repo →
   sidebar → fetch tree → route to a file (hash or README). Reference §40. */

/* ── global error handlers (reference §39) ── */
window.addEventListener( 'error', ( e ) => console.error( 'TooToo error:', e.message ) );
window.addEventListener( 'unhandledrejection', ( e ) => console.error( 'TooToo unhandled rejection:', e.reason ) );

const initApp = async () => {
  // Per-repo branding: tootoo.config.js (loaded in <head>, if present) sets
  // window.TOOTOO_CONFIG; merge it over the built-in + baked config so a dropped-in
  // repo can override theme/appName/hidden files (canonical's fork model).
  if ( window.TOOTOO_CONFIG && typeof window.TOOTOO_CONFIG === 'object' ) Object.assign( CONFIG, window.TOOTOO_CONFIG );

  // Heartbeat for reload-vs-restore detection (read during hash routing below): stamp the
  // time whenever this page is navigated away from. A reload re-reads it moments later; a
  // session-restore re-reads a stale one. Registered before any early return so every exit
  // path stamps. (CONFIG is merged first so a fork's storagePrefix is already in effect.)
  window.addEventListener( 'pagehide', () => {
    try { sessionStorage.setItem( storageKey( 'sessionBeat' ), String( Date.now() ) ); } catch ( _ ) { /* storage off */ }
  } );

  initHeader();     // header.js  — branding + appearance controls
  initContent();    // content.js — wire Copy / view-toggle / etc.
  renderFooter();   // footer.js  — brand bar
  applyHeadingFont(); // core.js  — load + apply CONFIG.headingFont(Url) for headings/title

  await detectLocalMode();  // core.js — file:// drop-in: seed owner/repo, read files from disk
  // Can't read local files → explain, don't silently browse the baked default. But if a
  // repo is explicitly chosen — URL ?owner=… or a per-repo tootoo.config.js — browse it
  // over GitHub (https needs no flag) instead of showing the help.
  const haveExplicitRepo = new URLSearchParams( location.search ).get( 'owner' )
    || ( window.TOOTOO_CONFIG && window.TOOTOO_CONFIG.owner );
  if ( fileAccessBlocked && !haveExplicitRepo ) { showFileAccessHelp(); return; }
  await detectRepo();       // core.js — params → cache → Pages host → CONFIG → manual form
  updateHeaderFromConfig(); // header.js — repo now known, so refresh the title (owner / repo)
  updateFooterCopyright();  // footer.js — repo owner now known, set the © line
  initSidebar();    // sidebar.js — wire filter/expand/select (tree fills next)

  if ( !state.owner || !state.repo ) {
    document.getElementById( 'contentBody' ).innerHTML =
      '<p style="padding:1rem;">Add <code>?owner=…&amp;repo=…</code> to the URL to load a repository.</p>';
    return;
  }

  await fetchTree();                       // sidebar.js — GitHub tree → state.tree → render
  updateFooterLicense();                   // footer.js — link to the repo's own LICENSE (tree now loaded)

  // No tree here means fetchTree already rendered an explanation — the oversized
  // notice, or the rate-limit/404 token panel. Stop before the hash routing below
  // clobbers that panel with a bare fetch error (the permalink-while-rate-limited case).
  if ( !state.tree ) return;

  // Back/forward + address-bar hash edits re-open the file (and/or scroll to the
  // in-file anchor after the first raw '#').
  window.addEventListener( 'hashchange', () => {
    const { path, anchor } = parseHash();
    if ( !path ) return;
    if ( path === state.currentFilePath ) { if ( anchor ) scrollToAnchor( anchor ); return; }
    selectFile( path, anchor );
  } );

  // Distinguish a RELOAD (keep your place) from a browser SESSION-RESTORE (go home).
  // Both bring back the URL hash and sessionStorage, so we time it instead: on pagehide
  // the app stamps `sessionBeat` (see initApp top). performance.timeOrigin is this load's
  // navigation start, so `timeOrigin - beat` is the gap since the previous page went away —
  // sub-second for a reload (back-to-back), but seconds+ for a restore (browser was closed).
  // No stamp at all → a genuinely fresh context (new tab / directly opened permalink).
  const RELOAD_GRACE_MS = 3000;          // a reload's gap is sub-second; restores far exceed this
  let restored = false;
  try {
    const beat = sessionStorage.getItem( storageKey( 'sessionBeat' ) );
    restored = beat !== null && ( performance.timeOrigin - Number( beat ) ) > RELOAD_GRACE_MS;
  } catch ( _ ) { restored = false; }    // storage off → not a restore, so permalinks still open

  if ( restored ) {
    autoSelectReadme();                  // restored session → always the home page
  } else {
    // Fresh open or reload — File-open priority: URL hash → last-opened (this session) → README.
    const { path: hashPath, anchor: hashAnchor } = parseHash();
    if ( hashPath ) {
      selectFile( hashPath, hashAnchor );
    } else {
      let last = null;
      try { last = sessionStorage.getItem( getCurrentFileKey() ); } catch ( _ ) { /* storage off */ }
      if ( last && state.tree?.some( ( i ) => i.path === last && i.type === 'blob' ) ) selectFile( last );
      else autoSelectReadme();
    }
  }
};

/* file:// + local reads blocked → tell the user how to enable the flag instead of
   silently browsing the configured default repo (which looks like a bug). */
const showFileAccessHelp = () => {
  const cb = document.getElementById( 'contentBody' );
  if ( !cb ) return;
  cb.innerHTML = `
    <div style="padding:1rem; max-width:46rem; line-height:1.55;">
      <h2 style="margin-top:0;">Can't read local files</h2>
      <p>This page is running from <code>file://</code> inside what looks like a git
      repository, but the browser blocked reading local files — so TooToo can't tell
      which repo this is, and won't guess.</p>
      <p>To browse the local repo, Chrome needs the file-access flag:</p>
      <ol>
        <li><strong>Quit Chrome completely</strong> — every window. (Chrome reuses a
        running process and ignores new flags, which is the usual culprit.)</li>
        <li>Relaunch it with <code>--allow-file-access-from-files</code>.</li>
        <li>Confirm at <code>chrome://version</code> → “Command Line” that the flag is
        listed, then reopen this file.</li>
      </ol>
      <p style="opacity:0.7;">Or add <code>?owner=…&amp;repo=…</code> to the URL to browse a repo over the network.</p>
    </div>`;
};

initApp();
