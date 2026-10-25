/* TooToo — config.js: per-build config for the ASSEMBLED dev build.
   Object.assigns over the core defaults, baking a default repo + dev identity so the
   standalone index.html is testable on its own. The -Prod build swaps in the empty
   config.prod.js instead, keeping production neutral. (URL ?owner=…&repo=… still wins.) */
Object.assign( CONFIG, {
  appName: 'TooToo Dev',
  subtitle: 'a GitHub repository browser',
  owner: 'Pushme-Pullyou',                       // default repo to browse
  repo: 'tootoo',
  headingFont: '"Rammetto One", sans-serif',     // heading + title face
  headingFontUrl: 'https://fonts.googleapis.com/css2?family=Rammetto+One&display=swap',
  // homeUrl: 'https://theo-armour.github.io',   // ⌂ hub link in the header (forks set this in tootoo.config.js)
  // hiddenFiles: [ '/index.html' ],             // hide a name from the tree; '/name' anchors to the repo root
} );


