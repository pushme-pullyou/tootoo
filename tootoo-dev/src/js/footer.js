/* TooToo — footer.js  (repo-owner copyright + license link).
   Left: favicon mark (static markup) + "© <year> <owner>", plus CONFIG.rightsText
   when the owner is in scope (see rightsOwners). Right: License link. */

const renderFooter = () => {
  updateFooterCopyright();
};

/* Copyright by the repo owner, e.g. "© 2026 pushme-pullyou · No rights reserved".
   The rights phrase (CONFIG.rightsText) is appended only when CONFIG.rightsOwners
   covers this repo's owner — null = all owners, an array = just those, [] = none —
   so a fork asserts its rights on its own repos but stays blank on others. */
const updateFooterCopyright = () => {
  const el = document.getElementById( 'footerCopyright' );
  if ( !el ) return;
  if ( !state.owner ) { el.textContent = ''; return; }
  const owns = !CONFIG.rightsOwners ||
    CONFIG.rightsOwners.some( ( o ) => o.toLowerCase() === state.owner.toLowerCase() );
  const rights = ( CONFIG.rightsText && owns ) ? ` · ${ CONFIG.rightsText }` : '';
  el.textContent = `© ${ new Date().getFullYear() } ${ state.owner }${ rights }.`;
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
