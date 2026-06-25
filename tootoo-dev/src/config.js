/* TooToo — config.js: per-build config for the ASSEMBLED dev build.
   Object.assigns over the core defaults, baking a default repo + dev identity so the
   standalone index.html is testable on its own. The -Prod build swaps in the empty
   config.prod.js instead, keeping production neutral. (URL ?owner=…&repo=… still wins.) */
Object.assign( CONFIG, {
  appName: 'TooToo Dev',
  subtitle: 'a GitHub repository browser',
  owner: 'Pushme-Pullyou',                       // default repo to browse
  repo: 'tootoo',
  faviconLetters: 'TT',                          // 2 letters in the generated SVG favicon
  faviconColor: '#2563eb',                       // favicon background
  // faviconFile: 'favicon.ico',                 // use a real favicon.ico instead of the generated mark
  // hiddenFiles: [ '/index.html' ],             // hide a name from the tree; '/name' anchors to the repo root
} );
