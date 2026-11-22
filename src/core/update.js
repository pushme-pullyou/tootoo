// update.js: "rN available" (SPEC.md §5, decisions 3, 13, 16–19).
//
// The check: on a numbered release, for a likely maintainer (the page is opened via file://,
// or a GitHub token is saved), at most once a day, read CONFIG.updateUrl. The answer is
// remembered, so the notice shows all day without asking again. Failures are silent.
//
// The swap: fetch rN's index.html and put this page's own config block in place of rN's,
// markers included, as text: the block is never run or changed. Then offer the file as a download.
// Owns state.release and state.latest. Emits update-available.

const Update = {

  // Built from parts, so this file never holds a whole marker (assemble.ps1 checks for that).
  START: '<!-- TOOTOO-CONFIG-' + 'START',
  END: '<!-- TOOTOO-CONFIG-' + 'END -->',
  DAY: 24 * 60 * 60 * 1000,

  // ── Swappable for the tests ──
  storage: () => window.localStorage,
  request: ( url ) => fetch( url, { cache: 'no-cache' } ),
  clock: () => Date.now(),
  release: () => ( document.querySelector( 'meta[name="tootoo-release"]' ) || {} ).content || 'dev',
  save: ( blob, name ) => {
    const link = document.createElement( 'a' );
    link.href = URL.createObjectURL( blob );
    link.download = name;
    link.click();
    setTimeout( () => URL.revokeObjectURL( link.href ), 10000 );
  },

  // ── Releases ──

  number: ( release ) => Number( ( /^r(\d+)$/.exec( release || '' ) || [] )[ 1 ] || 0 ),   // 'r10' → 10; 'dev' → 0
  isNewer: ( latest, current ) => Update.number( latest ) > Update.number( current ),
  isMaintainer: ( protocol = location.protocol, token = GitHub.getToken() ) => protocol === 'file:' || Boolean( token ),
  isDue: ( checkedAt, now = Update.clock() ) => ! checkedAt || now - checkedAt >= Update.DAY,

  // { checkedAt, latest }, kept per browser.
  key: () => `${ CONFIG.storagePrefix }:update`,
  recall: () => {
    try { return JSON.parse( Update.storage().getItem( Update.key() ) ) || {}; } catch ( error ) { return {}; }
  },
  remember: ( memory ) => {
    try { Update.storage().setItem( Update.key(), JSON.stringify( memory ) ); } catch ( error ) { /* not remembered */ }
  },

  // latest.json → { release, date, url, notes }, or null if it isn't one.
  fetchLatest: async ( url ) => {
    const response = await Update.request( url );
    const latest = response.ok ? await response.json() : null;
    return latest && /^r\d+$/.test( latest.release ) && latest.url ? latest : null;
  },

  // Called once at startup. Resolves to the newer release, or null.
  check: async ( config = CONFIG ) => {
    state.release = Update.release();
    if ( ! config.checkForUpdates || ! Update.number( state.release ) || ! Update.isMaintainer() ) { return null; }
    const memory = Update.recall();
    const due = Update.isDue( memory.checkedAt );
    const latest = due ? await Update.fetchLatest( config.updateUrl ).catch( () => memory.latest || null ) : memory.latest;
    if ( due ) { Update.remember( { checkedAt: Update.clock(), latest } ); }
    if ( ! latest || ! Update.isNewer( latest.release, state.release ) ) { return null; }
    state.latest = latest;
    Events.emit( 'update-available', latest );
    return latest;
  },

  // ── The swap ──

  count: ( text, marker ) => text.split( marker ).length - 1,

  // Where the block is in `text`: { start, end, block }. Anything but one clean block is an error.
  blockOf: ( text, which ) => {
    const starts = Update.count( text, Update.START );
    const ends = Update.count( text, Update.END );
    if ( starts !== 1 || ends !== 1 ) {
      throw new Error( `${ which } needs each config marker exactly once; found START ${ starts } time(s) and END ${ ends } time(s).` );
    }
    const start = text.indexOf( Update.START );
    const end = text.indexOf( Update.END ) + Update.END.length;
    if ( end < start ) { throw new Error( `${ which }: the END marker comes before START.` ); }
    return { start, end, block: text.slice( start, end ) };
  },

  // The new release's text, with its block replaced by the page's own, byte for byte.
  swap: ( newText, ownText ) => {
    const fresh = Update.blockOf( newText, 'The new release' );
    const own = Update.blockOf( ownText, 'This page' );
    return newText.slice( 0, fresh.start ) + own.block + newText.slice( fresh.end );
  },

  // The page's block rebuilt from the DOM: its comments, the whitespace and the <script> between.
  // (The browser has already turned any CRLF into LF.)
  blockFromDom: ( doc = document ) => {
    const walker = doc.createTreeWalker( doc, NodeFilter.SHOW_COMMENT );
    const isStart = ( node ) => `<!--${ node.data }-->`.startsWith( Update.START );
    let start = walker.nextNode();
    while ( start && ! isStart( start ) ) { start = walker.nextNode(); }
    if ( ! start ) { return ''; }
    const parts = [];
    for ( let node = start; node; node = node.nextSibling ) {
      const html = node.nodeType === Node.COMMENT_NODE ? `<!--${ node.data }-->` : node.nodeType === Node.TEXT_NODE ? node.data : node.outerHTML;
      parts.push( html );
      if ( html === Update.END ) { break; }
    }
    return parts.join( '' );
  },

  // This page's own text: fetched, for exact bytes; or the block from the DOM when that's not allowed.
  ownSource: async () => {
    try {
      const text = await ( await fetch( location.href.split( '#' )[ 0 ] ) ).text();
      if ( text.includes( Update.START ) ) { return text; }
    } catch ( error ) { /* file:// without file access: use the DOM */ }
    return Update.blockFromDom();
  },

  download: async ( latest ) => {
    const response = await Update.request( latest.url );
    if ( ! response.ok ) { throw new Error( `${ latest.url } gave ${ response.status }` ); }
    const merged = Update.swap( await response.text(), await Update.ownSource() );
    Update.save( new Blob( [ merged ], { type: 'text/html' } ), 'index.html' );
  },

  // ── The notice ──

  noticeHtml: ( latest ) => {
    const esc = Shell.escape;
    const notes = latest.notes ? ` <a href="${ esc( latest.notes ) }" target="_blank" rel="noopener">What's new</a>` : '';
    return `<strong>TooToo ${ esc( latest.release ) } available</strong> (this page has ${ esc( state.release ) }).${ notes }
      <button type="button" class="primary" data-action="download-update">⬇ Download updated index.html</button>
      <button type="button" data-action="dismiss-update" aria-label="Close">✕</button>
      <span class="update-status" role="status"></span>`;
  },

  onClick: async ( event ) => {
    const button = event.target.closest( '[data-action]' );
    const notice = event.currentTarget;
    const status = notice.querySelector( '.update-status' );
    if ( button && button.dataset.action === 'dismiss-update' ) { notice.hidden = true; }
    if ( ! button || button.dataset.action !== 'download-update' ) { return; }
    status.textContent = 'Building it…';
    try {
      await Update.download( state.latest );
      status.textContent = 'Downloaded, with your settings. Rename your old index.html to index.bak, then put the new file in its place.';
    } catch ( error ) {
      status.innerHTML = `Couldn't build it here (${ Shell.escape( error.message ) }). Instead, download
        <a href="${ Shell.escape( state.latest.url ) }">${ Shell.escape( state.latest.release ) }</a> and copy your settings by hand:
        everything between the two TOOTOO-CONFIG marker lines.`;
    }
  },

  // element: where the notice shows. Starts the check. Returns the unmount function.
  mount: ( element ) => {
    const show = ( latest ) => {
      element.innerHTML = Update.noticeHtml( latest );
      element.hidden = false;
    };
    Events.on( 'update-available', show );
    element.addEventListener( 'click', Update.onClick );
    Update.check().catch( () => {} );
    return () => {
      Events.off( 'update-available', show );
      element.removeEventListener( 'click', Update.onClick );
    };
  },

};
