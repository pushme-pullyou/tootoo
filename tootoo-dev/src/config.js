/* TooToo — config.js: per-build config for the ASSEMBLED (live) build.
   Object.assigns over the core defaults. This file (not mock-data.js) is what
   the assembler includes, so `mockFiles` is undefined in the assembled build and
   the data layer fetches real files from GitHub.

   owner/repo here are the default repo; ?owner=…&repo=…&branch=… in the URL wins. */
Object.assign( CONFIG, {
  appName: 'TooToo Dev',
  subtitle: 'a GitHub repository browser',
  owner: 'pushme-pullyou',
  repo: 'tootoo',
  faviconLetters: 'TT',     // 2 letters drawn into the favicon + brand marks
  faviconColor: '#2563eb',  // favicon background color
} );
