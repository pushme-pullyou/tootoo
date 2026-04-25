/* TooToo — pure helpers shared between index.html and tootoo-test.html.
   These functions have no DOM, network, or app-state dependencies, so
   they're safe to import into the test harness as-is. */

'use strict';

const escapeHTML = ( str ) => {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String( str ).replace( /[&<>"']/g, ( c ) => map[ c ] );
};

const encodePath = ( path ) =>
  path.split( '/' ).map( encodeURIComponent ).join( '/' );

const RATE_LIMIT_MESSAGE = 'Rate limited. Add a GitHub token for higher limits.';

// Resolve a Markdown link target against the current file's directory,
// honoring root-relative ('/foo'), parent ('..'), and current ('.') segments.
const resolveRepoPath = ( targetPath, currentDir = '' ) => {
  const isRootRelative = targetPath.startsWith( '/' );
  const resolved = isRootRelative
    ? targetPath.slice( 1 )
    : ( currentDir ? currentDir + '/' + targetPath : targetPath );

  return resolved.split( '/' ).reduce( ( acc, part ) => {
    if ( part === '..' ) acc.pop();
    else if ( part !== '.' && part !== '' ) acc.push( part );
    return acc;
  }, [] ).join( '/' );
};
