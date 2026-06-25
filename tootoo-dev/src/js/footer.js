/* TooToo — footer.js  (repo-owner copyright + license link).
   Left: TT mark + "© <year> <owner> · No rights reserved." Right: License link. */

const renderFooter = () => {
  const mark = document.querySelector( '.app-footer-mark' );
  if ( mark ) mark.src = brandMarkSrc();   // real favicon.ico if present, else CONFIG mark
  updateFooterCopyright();
};

/* Copyright by the repo owner, e.g. "© 2026 pushme-pullyou · No rights reserved." */
const updateFooterCopyright = () => {
  const el = document.getElementById( 'footerCopyright' );
  if ( !el ) return;
  el.textContent = state.owner
    ? `© ${ new Date().getFullYear() } ${ state.owner } · No rights reserved.`
    : 'No rights reserved.';
};

/* Point the license link at the repo's own root LICENSE file (opened in-app via the
   hash) when present; otherwise fall back to the opensource.org license list. Call
   after the tree loads. */
const updateFooterLicense = () => {
  const el = document.querySelector( '.app-footer-license' );
  if ( !el ) return;
  const lic = state.tree?.find( ( i ) =>
    i.type === 'blob' && /^(licen[sc]e|copying)(\.\w+)?$/i.test( i.path ) );
  if ( lic ) {
    el.href = '#' + encodePath( lic.path );   // opens it in TooToo via hash routing
    el.removeAttribute( 'target' );
    el.removeAttribute( 'rel' );
    el.title = `View ${ lic.path }`;
  } else {
    el.href = 'https://opensource.org/licenses';
    el.target = '_blank';
    el.rel = 'noopener';
    el.title = 'Open source licenses (opensource.org)';
  }
};
