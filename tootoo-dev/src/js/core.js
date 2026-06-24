/* TooToo — core.js  (shared services, no DOM, no UI).
   In the real app these live in the core layer (reference §1, §15, §16, §18-helpers).
   Only the helpers the carved components need are here for now; this file grows
   as we carve. Per ARCHITECTURE.md, core is the single owner of CONFIG + state
   and the shared utilities every component reads. */

/* ── CONFIG + state (core OWNS these; populated by config.js for the assembled
   live build, or by mock-data.js for the offline standalone component pages) ── */
const CONFIG = {
  owner: '', repo: '', branch: '',
  appName: 'TooToo', subtitle: '',
  themeColor: '',           // empty = the CSS default (blue) — and lets body.dark-mode's
  // brighter #3b82f6 win; a fork's explicit color applies to both modes
  faviconLetters: 'TT', faviconColor: '#2563eb',
  headingFontUrl: '', headingFont: '',
  sourceRepoUrl: 'https://github.com/pushme-pullyou/tootoo',
  storagePrefix: 'tootoo',
  hiddenFolders: [ 'Images' ], hiddenFiles: [], maxRepoFiles: 5000,
};
const state = { owner: '', repo: '', branch: '', tree: null, currentFilePath: '', repoUpdated: '', oversized: false };

/* ── escape for safe innerHTML ── */
const escapeHTML = ( s ) =>
  String( s ).replace( /[&<>"']/g, ( c ) =>
    ( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ c ] ) );

/* ── folder/file display name: hyphens shown as spaces ── */
const displayTreeName = ( name ) => name.replace( /-/g, ' ' );

/* ── file type icons ── */
const getFileIcon = ( fileName ) => {
  const ext = fileName.includes( '.' ) ? '.' + fileName.split( '.' ).pop().toLowerCase() : '';
  const iconMap = {
    '.md': '📝',
    '.js': '🟨', '.mjs': '🟨', '.cjs': '🟨',
    '.ts': '🟦', '.tsx': '🟦',
    '.py': '🐍',
    '.html': '🌐', '.htm': '🌐',
    '.css': '🎨', '.scss': '🎨', '.less': '🎨',
    '.png': '🖼️', '.jpg': '🖼️', '.jpeg': '🖼️', '.gif': '🖼️', '.webp': '🖼️', '.svg': '🖼️', '.ico': '🖼️',
    '.mp3': '🎵', '.wav': '🎵', '.ogg': '🎵',
    '.mp4': '🎬', '.webm': '🎬',
    '.pdf': '📕',
    '.xlsx': '📊', '.xls': '📊', '.csv': '📊', '.ods': '📊',
    '.yaml': '⚙️', '.yml': '⚙️', '.toml': '⚙️',
    '.zip': '📦', '.tar': '📦', '.gz': '📦', '.7z': '📦',
    '.json': '{ }',
  };
  return iconMap[ ext ] || '📄';
};

/* ── human file size ── */
const formatFileSize = ( bytes ) => {
  if ( bytes == null ) return '';
  if ( bytes < 1024 ) return `${ bytes } B`;
  if ( bytes < 1024 * 1024 ) return `${ ( bytes / 1024 ).toFixed( 1 ) } KB`;
  return `${ ( bytes / ( 1024 * 1024 ) ).toFixed( 1 ) } MB`;
};

/* ── friendly file-type label (for tooltips) ── */
const FILE_TYPE_LABELS = {
  md: 'Markdown', markdown: 'Markdown', mkd: 'Markdown', mdown: 'Markdown',
  js: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript', jsx: 'JavaScript',
  ts: 'TypeScript', tsx: 'TypeScript',
  py: 'Python', rb: 'Ruby', go: 'Go', rs: 'Rust', java: 'Java', kt: 'Kotlin',
  c: 'C', h: 'C header', cpp: 'C++', cc: 'C++', hpp: 'C++ header', cs: 'C#', php: 'PHP', swift: 'Swift',
  sh: 'Shell', bash: 'Shell', zsh: 'Shell', pl: 'Perl', lua: 'Lua', r: 'R', sql: 'SQL',
  html: 'HTML', htm: 'HTML', css: 'CSS', scss: 'Sass', less: 'Less',
  json: 'JSON', xml: 'XML', yaml: 'YAML', yml: 'YAML', toml: 'TOML', ini: 'INI',
  csv: 'CSV', tsv: 'TSV', txt: 'Text', log: 'Log',
  png: 'PNG image', jpg: 'JPEG image', jpeg: 'JPEG image', gif: 'GIF image',
  webp: 'WebP image', svg: 'SVG image', ico: 'Icon',
  mp3: 'Audio', wav: 'Audio', ogg: 'Audio', mp4: 'Video', webm: 'Video',
  pdf: 'PDF', xlsx: 'Spreadsheet', xls: 'Spreadsheet', ods: 'Spreadsheet',
  zip: 'Archive', tar: 'Archive', gz: 'Archive', '7z': 'Archive',
};
const getFileTypeLabel = ( name ) => {
  const ext = name.includes( '.' ) ? name.split( '.' ).pop().toLowerCase() : '';
  return FILE_TYPE_LABELS[ ext ] || ( ext ? `${ ext.toUpperCase() } file` : 'File' );
};

/* ── hidden-from-tree config (CONFIG.hiddenFolders / hiddenFiles) ── */
const hiddenFolderSet = () => new Set( ( CONFIG.hiddenFolders || [] ).map( ( s ) => s.toLowerCase() ) );
const hiddenFileSet = () => new Set( ( CONFIG.hiddenFiles || [] ).map( ( s ) => s.toLowerCase() ) );

/* Dotfiles/dotfolders and CONFIG-hidden names are dropped from the sidebar. */
const isVisibleTreeItem = ( item, folders, files ) => {
  const parts = item.path.split( '/' );
  if ( parts.some( ( p ) => p.startsWith( '.' ) || folders.has( p.toLowerCase() ) ) ) return false;
  return !( item.type === 'blob' && files.has( parts[ parts.length - 1 ].toLowerCase() ) );
};

/* ── extension constants (reference §3) — used by the content file-header ── */
const IMAGE_EXTS = [ 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico' ];
const AUDIO_EXTS = [ 'mp3', 'wav', 'ogg' ];
const VIDEO_EXTS = [ 'mp4', 'webm' ];
const SHEET_EXTS = [ 'xlsx', 'xls', 'csv', 'ods' ];
const STREAMABLE_EXTS = [ ...IMAGE_EXTS, ...AUDIO_EXTS, ...VIDEO_EXTS, 'pdf' ];
const NO_COPY_EXTS = [ ...STREAMABLE_EXTS, ...SHEET_EXTS ];
const MARKDOWN_EXTS = [ 'md', 'markdown', 'mkd', 'mdown', 'mkdn' ];
const TAB_VIEWABLE_EXTS = [
  'html', 'htm', 'pdf', 'txt', 'text', ...MARKDOWN_EXTS,
  ...IMAGE_EXTS, ...AUDIO_EXTS, ...VIDEO_EXTS,
  'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'json', 'css', 'scss', 'less',
  'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'env',
  'py', 'rb', 'go', 'rs', 'java', 'kt', 'c', 'h', 'cpp', 'cc', 'hpp',
  'cs', 'php', 'sh', 'bash', 'zsh', 'sql', 'pl', 'lua', 'r', 'swift', 'log',
];
const isDownloadAction = ( ext ) => !TAB_VIEWABLE_EXTS.includes( ext );
const isTextOpenAsPlain = ( ext ) =>
  !ext || MARKDOWN_EXTS.includes( ext ) || [ 'obj', 'stl', 'mtl' ].includes( ext );

/* ── encode an in-repo path for a URL (keep the slashes) ── */
const encodePath = ( p ) => p.split( '/' ).map( encodeURIComponent ).join( '/' );

/* ── blob URL tracking + revocation (reference §5) — revoked on each navigate
   so media/PDF blobs don't leak as you browse. ── */
const blobUrls = new Set();
const createBlobUrl = ( blob ) => { const u = URL.createObjectURL( blob ); blobUrls.add( u ); return u; };
const revokeAllBlobUrls = () => {
  for ( const u of blobUrls ) { try { URL.revokeObjectURL( u ); } catch ( _ ) { /* noop */ } }
  blobUrls.clear();
};

/* ── GitHub mark, for the content file-header link ── */
const GITHUB_SVG_ICON =
  `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path></svg>`;

/* ── favicon from CONFIG.faviconLetters / faviconColor (reference §11) — reused
   for the footer + sidebar brand marks so all three reflect the config. ── */
const faviconDataUrl = () => {
  const letters = String( CONFIG.faviconLetters || 'TT' );
  const l1 = encodeURIComponent( ( letters[ 0 ] || 'T' ).toUpperCase() );
  const l2 = encodeURIComponent( ( letters[ 1 ] || letters[ 0 ] || 'T' ).toUpperCase() );
  const fill = ( CONFIG.faviconColor || '#2563eb' ).replace( '#', '%23' );
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E` +
    `%3Crect width='64' height='64' rx='12' fill='${ fill }'/%3E` +
    `%3Cg font-family='system-ui,sans-serif' font-size='30' font-weight='700' fill='white' text-anchor='middle' dominant-baseline='middle'%3E` +
    `%3Ctext x='22' y='28'%3E${ l1 }%3C/text%3E%3Ctext x='42' y='40'%3E${ l2 }%3C/text%3E%3C/g%3E%3C/svg%3E`;
};
const applyFavicon = () => {
  const link = document.querySelector( 'link[rel="icon"]' );
  if ( link ) link.href = faviconDataUrl();
};

/* ── optional heading typeface (reference §11): load CONFIG.headingFontUrl into
   <head> and set --heading-font, which the h1–h6/#headerTitle CSS already consumes.
   Omitting either knob is a no-op (the var falls back to the body font). ── */
const applyHeadingFont = () => {
  if ( CONFIG.headingFontUrl ) {
    const link = document.createElement( 'link' );
    link.rel = 'stylesheet';
    link.href = CONFIG.headingFontUrl;
    document.head.appendChild( link );
  }
  if ( CONFIG.headingFont ) {
    document.documentElement.style.setProperty( '--heading-font', CONFIG.headingFont );
  }
};

/* ── per-extension Rendered/Raw preference (reference §7) ── */
const viewPrefKey = ( ext ) => `${ CONFIG.storagePrefix || 'tootoo' }-dev:viewPref:${ ext }`;
const getPreferredView = ( ext ) => {
  try { return localStorage.getItem( viewPrefKey( ext ) ) || 'rendered'; } catch ( _ ) { return 'rendered'; }
};
const setPreferredView = ( ext, view ) => {
  try { localStorage.setItem( viewPrefKey( ext ), view ); } catch ( _ ) { /* storage disabled */ }
};

/* ===================================================================
   DATA LAYER  (carved 2026-06-21) — GitHub services + repo detection.
   Includes: GitHub REST (tree + default branch), raw.githubusercontent file
   fetch (text / blob / arraybuffer) with an in-memory cache + request abort,
   optional token auth, hash routing, and a simplified local file:// mode.
   Repo detection is query-param / CONFIG / .git/config — NOT yet GitHub Pages
   hostname detection (see PARITY.md blockers).
   =================================================================== */

/* ── request abort (cancel in-flight fetch when navigating away) ── */
let currentAbortController = null;
const newAbort = () => {
  if ( currentAbortController ) currentAbortController.abort();
  currentAbortController = new AbortController();
  return currentAbortController.signal;
};

/* ── in-memory file-text cache (per session; capped, FIFO eviction) ── */
const fileTextCache = new Map();
const cacheKey = ( path ) => `${ state.owner }/${ state.repo }/${ state.branch }/${ path }`;
const cachePut = ( key, text ) => {
  fileTextCache.set( key, text );
  if ( fileTextCache.size > 50 ) fileTextCache.delete( fileTextCache.keys().next().value );
};
const clearFileCache = () => fileTextCache.clear();

/* ── GitHub token (optional, from localStorage) ── */
const tokenStorageKey = () => `${ CONFIG.storagePrefix }-dev:${ location.pathname }:githubToken`;
const migrateTokenStorage = () => {
  try {
    const scopedKey = tokenStorageKey();
    const oldScopedKey = `${ CONFIG.storagePrefix }-dev:token`;
    const legacyToken = localStorage.getItem( 'githubToken' );
    const oldScopedToken = localStorage.getItem( oldScopedKey );
    if ( localStorage.getItem( scopedKey ) === null ) {
      const candidate = oldScopedToken || legacyToken;
      if ( candidate ) localStorage.setItem( scopedKey, candidate );
    }
    localStorage.removeItem( oldScopedKey );
    localStorage.removeItem( 'githubToken' );
  } catch ( _ ) { /* storage disabled */ }
};
const getToken = () => {
  try { return localStorage.getItem( tokenStorageKey() ) || ''; } catch ( _ ) { return ''; }
};
const ghHeaders = () => {
  const h = { Accept: 'application/vnd.github+json' };
  const t = getToken();
  if ( t ) h.Authorization = `token ${ t }`;
  return h;
};

/* ── live API rate badge ── */
const updateRateBadge = ( res ) => {
  const remaining = res.headers.get( 'X-RateLimit-Remaining' );
  const limit = res.headers.get( 'X-RateLimit-Limit' );
  if ( remaining === null || limit === null ) return;
  const n = parseInt( remaining, 10 );

  // Live count lives in the ⚙️ tooltip; the header badge surfaces it when low.
  const tokenBtn = document.getElementById( 'btnToken' );
  if ( tokenBtn ) tokenBtn.title = `${ remaining }/${ limit } GitHub API requests left this hour — click to set a token`;

  // The header badge only surfaces as a warning when low (≤30) / critical (≤10).
  const badge = document.getElementById( 'rateBadge' );
  if ( badge ) {
    badge.textContent = `${ remaining }/${ limit }`;
    badge.classList.toggle( 'critical', n <= 10 );
    badge.classList.toggle( 'low', n > 10 && n <= 30 );
    badge.style.display = n <= 30 ? 'inline-block' : 'none';
  }
};

/* ── GitHub REST call (JSON) ── */
const ghApi = async ( url, signal ) => {
  const res = await fetch( url, { headers: ghHeaders(), signal } );
  updateRateBadge( res );
  if ( res.status === 403 ) {
    const err = new Error( 'Rate limited. Add a GitHub token for higher limits.' );
    err.status = 403;
    throw err;
  }
  if ( res.status === 404 ) {
    const err = new Error( 'Not found (private repo, or wrong owner/repo/branch).' );
    err.status = 404;
    throw err;
  }
  if ( !res.ok ) throw new Error( `GitHub API error: ${ res.status }` );
  return res.json();
};

/* ── raw file URL + fetchers ── */
const rawUrl = ( path ) =>
  `https://raw.githubusercontent.com/${ state.owner }/${ state.repo }/${ state.branch }/${ encodePath( path ) }`;

/* Fetch a file's Response — local-first (file:// drop-in) then raw GitHub. */
const fetchFileResponse = async ( path, signal ) => {
  const local = localUrlFor( path );
  if ( local ) {
    try { const r = await fetch( local, { signal } ); if ( r.ok ) return r; }
    catch ( e ) { if ( e.name === 'AbortError' ) throw e; /* fall through to GitHub */ }
  }
  const res = await fetch( rawUrl( path ), { signal } );
  if ( !res.ok ) throw new Error( `Failed to load ${ path }: ${ res.status }` );
  return res;
};

const fetchFileText = async ( path, signal ) => {
  // Offline standalone pages define mockFiles; never hit the network there.
  if ( typeof mockFiles !== 'undefined' ) {
    if ( mockFiles[ path ] != null ) return mockFiles[ path ];
    throw new Error( `File not found: ${ path }` );
  }
  const key = cacheKey( path );
  if ( fileTextCache.has( key ) ) return fileTextCache.get( key );
  const text = await ( await fetchFileResponse( path, signal ) ).text();
  cachePut( key, text );
  return text;
};

const resolveMediaUrl = ( path ) => localUrlFor( path ) || rawUrl( path );

/* ── binary fetch for media / spreadsheets, with correct MIME for inline view
   (raw.githubusercontent serves octet-stream, which the browser would download;
   re-wrapping the blob with the right type lets <audio>/<video>/<iframe> play). ── */
const MIME = {
  wav: 'audio/wav', mp3: 'audio/mpeg', ogg: 'audio/ogg',
  mp4: 'video/mp4', webm: 'video/webm', pdf: 'application/pdf',
};
const fetchFileBlob = async ( path, mime, signal ) => {
  let blob = await ( await fetchFileResponse( path, signal ) ).blob();
  if ( mime ) blob = new Blob( [ blob ], { type: mime } );
  return createBlobUrl( blob );
};
const fetchFileArrayBuffer = async ( path, signal ) =>
  new Uint8Array( await ( await fetchFileResponse( path, signal ) ).arrayBuffer() );

/* ── local file:// mode (drop-in next to a checkout) ──
   Assumes the app sits at the repo ROOT, so files are siblings ('./path') and
   .git/config is './.git/config'. The tree still comes from the GitHub API (a
   directory can't be enumerated over file://); local mode sources FILE CONTENTS
   from disk and seeds owner/repo from .git/config. Needs a GitHub remote + a
   browser that allows file:// fetches (Chrome --allow-file-access-from-files). ── */
let localMode = false;
let fileAccessBlocked = false;   // file:// reads denied (Chrome missing --allow-file-access-from-files)
const detectLocalMode = async () => {
  if ( location.protocol !== 'file:' ) return;
  try {
    const res = await fetch( '.git/config' );
    if ( !res.ok ) return;
    const text = await res.text();
    // Match the origin URL — https + ssh (git@), repo names with dots, an optional
    // .git suffix and trailing slash, anchored to the end of the line.
    const m = text.match( /github\.com[:/]+([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?\s*$/im );
    // Local .git/config wins over the static CONFIG default (canonical precedence:
    // .git/config beats CONFIG_DEFAULTS). Query params still override in detectRepo.
    if ( m ) { CONFIG.owner = m[ 1 ]; CONFIG.repo = m[ 2 ]; CONFIG.branch = ''; }
    else { CONFIG.owner = ''; CONFIG.repo = ''; }   // in a git repo but no GitHub remote → ask, don't silently load tootoo
    localMode = true;
  } catch ( _ ) {
    // .git/config wasn't readable. Over file:// that's ambiguous: either there's no
    // git repo here, or Chrome is blocking ALL local reads (no --allow-file-access-
    // from-files). Disambiguate by probing a file we KNOW exists — this very page.
    // If even that read is blocked, the flag is missing → flag it so the UI explains
    // instead of silently browsing the configured default repo (the confusing case).
    try { await fetch( location.href.split( '#' )[ 0 ] ); /* readable → genuinely no .git here */ }
    catch ( _e ) { fileAccessBlocked = true; }
  }
};
const localUrlFor = ( path ) => ( localMode ? './' + encodePath( path ) : null );

/* ── per-pathname storage + repo cache (reference §4) ── */
const storageKey = ( suffix ) => `${ CONFIG.storagePrefix }-dev:${ location.pathname }:${ suffix }`;
const repoCacheKey = () => storageKey( 'repo' );
const cacheRepo = () => {
  try { localStorage.setItem( repoCacheKey(), JSON.stringify( { owner: state.owner, repo: state.repo, branch: state.branch, updated: state.repoUpdated } ) ); }
  catch ( _ ) { /* storage disabled */ }
};
const applyRepo = () => { state.owner = CONFIG.owner; state.repo = CONFIG.repo; state.branch = CONFIG.branch; };

/* ── repo detection (reference §9): params → localStorage cache → GitHub Pages
   hostname → CONFIG (incl. the local .git/config seed) → manual entry form. ── */
const detectRepo = async () => {
  const p = new URLSearchParams( location.search );
  if ( p.get( 'owner' ) ) CONFIG.owner = p.get( 'owner' );
  if ( p.get( 'repo' ) ) CONFIG.repo = p.get( 'repo' );
  if ( p.get( 'branch' ) ) CONFIG.branch = p.get( 'branch' );
  if ( CONFIG.owner && CONFIG.repo ) { applyRepo(); return; }

  try {
    const cached = JSON.parse( localStorage.getItem( repoCacheKey() ) || 'null' );
    if ( cached?.owner && cached?.repo ) {
      CONFIG.owner = cached.owner; CONFIG.repo = cached.repo;
      if ( cached.branch ) CONFIG.branch = cached.branch;
      applyRepo();
      if ( cached.updated ) state.repoUpdated = cached.updated;   // keep the title tooltip's repo date on cached loads
      return;
    }
  } catch ( _ ) { /* malformed cache */ }

  // Deployed forks: <owner>.github.io/<repo>/ → browse the repo it's served from.
  if ( location.hostname.endsWith( '.github.io' ) ) {
    const owner = location.hostname.split( '.' )[ 0 ];
    const segs = location.pathname.split( '/' ).filter( Boolean );
    CONFIG.owner = owner;
    CONFIG.repo = segs[ 0 ] || `${ owner }.github.io`;
    applyRepo(); cacheRepo(); return;
  }

  if ( CONFIG.owner && CONFIG.repo ) { applyRepo(); return; }

  return promptForRepo();   // nothing detected — ask the user
};

const promptForRepo = () => new Promise( ( resolve ) => {
  setContentHeader( makeSimpleHeader( 'Choose a repository' ) );
  document.getElementById( 'contentBody' ).innerHTML = `
    <div class="repo-form">
      <p>Couldn't auto-detect a repository — enter one:</p>
      <label for="inpOwner">GitHub owner</label>
      <input id="inpOwner" type="text" placeholder="e.g. octocat" autocomplete="off">
      <label for="inpRepo">Repository</label>
      <input id="inpRepo" type="text" placeholder="e.g. hello-world" autocomplete="off">
      <button id="btnSetRepo" class="primary">Open repository</button>
    </div>`;
  const go = () => {
    const owner = document.getElementById( 'inpOwner' ).value.trim();
    const repo = document.getElementById( 'inpRepo' ).value.trim();
    if ( !owner || !repo ) return;
    CONFIG.owner = owner; CONFIG.repo = repo; applyRepo(); cacheRepo(); resolve();
  };
  document.getElementById( 'btnSetRepo' ).addEventListener( 'click', go );
  document.getElementById( 'inpRepo' ).addEventListener( 'keydown', ( e ) => { if ( e.key === 'Enter' ) go(); } );
} );

/* ── resolve a repo-relative path against a directory (Markdown links/images) ── */
const resolveRepoPath = ( href, currentDir ) => {
  if ( href.startsWith( '/' ) ) return href.replace( /^\/+/, '' );   // root-relative
  const stack = currentDir ? currentDir.split( '/' ) : [];
  for ( const part of href.split( '/' ) ) {
    if ( part === '' || part === '.' ) continue;
    if ( part === '..' ) stack.pop();
    else stack.push( part );
  }
  return stack.join( '/' );
};

const scrollToMarkdownFragment = ( fragment ) => {
  if ( !fragment ) return;
  let decoded = fragment;
  try { decoded = decodeURIComponent( fragment ); } catch ( _ ) { /* keep raw fragment */ }
  const target = document.getElementById( decoded ) ||
    document.querySelector( `[name="${ CSS.escape( decoded ) }"]` );
  target?.scrollIntoView( { block: 'center', behavior: 'auto' } );
};

/* ── URL to open in a new tab / download (reference §31, simplified): the local
   file in drop-in mode, else the raw GitHub URL (text/images view, binaries download). ── */
const getNewTabUrl = ( path ) => localUrlFor( path ) || rawUrl( path );

const getDefaultBranch = async ( signal ) => {
  const data = await ghApi( `https://api.github.com/repos/${ encodeURIComponent( state.owner ) }/${ encodeURIComponent( state.repo ) }`, signal );
  // Capture the repo's real last-push date so the header tooltip reflects the
  // repo being viewed (incl. drop-in mode), not this file's static build date.
  state.repoUpdated = data.pushed_at || '';
  return data.default_branch;
};

/* ── hash routing ── */
// Assigning location.hash (vs replaceState) creates a history entry so browser
// back/forward navigate between files; the != guard avoids a redundant set/loop.
const updateHash = ( path ) => {
  const target = '#' + encodePath( path );
  if ( location.hash !== target ) { try { location.hash = target; } catch ( _ ) { /* noop */ } }
};
const currentHashPath = () => { try { return decodeURIComponent( location.hash.replace( /^#/, '' ) ); } catch ( _ ) { return ''; } };

/* ── last-opened file (sessionStorage, per owner/repo/branch) ── */
const getCurrentFileKey = () => storageKey( `currentFile:${ state.owner }/${ state.repo }/${ state.branch }` );
const saveCurrentFile = ( path ) => { try { sessionStorage.setItem( getCurrentFileKey(), path ); } catch ( _ ) { /* storage off */ } };
const clearCurrentFile = () => { try { sessionStorage.removeItem( getCurrentFileKey() ); } catch ( _ ) { /* storage off */ } };

/* ── repo statistics (reference §17) — for the About panel ── */
const getRepoStats = () => {
  if ( !state.tree ) return null;
  const blobs = state.tree.filter( ( i ) => i.type === 'blob' );
  const trees = state.tree.filter( ( i ) => i.type === 'tree' );
  const totalSize = blobs.reduce( ( s, i ) => s + ( i.size || 0 ), 0 );
  const extCounts = {};
  for ( const b of blobs ) {
    const name = b.path.split( '/' ).pop();
    const ext = name.includes( '.' ) ? '.' + name.split( '.' ).pop().toLowerCase() : '(no ext)';
    extCounts[ ext ] = ( extCounts[ ext ] || 0 ) + 1;
  }
  const topTypes = Object.entries( extCounts ).sort( ( a, b ) => b[ 1 ] - a[ 1 ] ).slice( 0, 10 );
  const largest = [ ...blobs ].sort( ( a, b ) => ( b.size || 0 ) - ( a.size || 0 ) ).slice( 0, 5 );
  return { fileCount: blobs.length, folderCount: trees.length, totalSize, topTypes, largest };
};

/* ── highlight.js theme follows dark mode (reference §10) ── */
const setHljsTheme = ( isDark ) => {
  const link = document.getElementById( 'hljsTheme' );
  if ( !link ) return;
  link.href = isDark
    ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
    : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
};
