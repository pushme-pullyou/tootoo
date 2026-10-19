/* TooToo Dev — mock data.
   Stands in for the globals the real app builds from GitHub + tootoo.config.js,
   so component pages run offline. Pure data only (no DOM, no behavior):
   - CONFIG  : the per-fork config (subset)
   - state   : the shared runtime state, pre-populated with a sample flat tree
   The flat `state.tree` mirrors the GitHub trees API shape: { path, type, size }.
   Note: `.github` (dotfolder) and `Images` (CONFIG.hiddenFolders) are present
   on purpose — the sidebar should hide them, proving the visibility rules. */

Object.assign( CONFIG, {
  appName: 'TooToo Dev',
  subtitle: 'a GitHub repository browser',
  themeColor: '#2563eb',
  // Mirror the fork's tootoo.config.js heading font so the harness is representative
  // (the dev page reads this mock, never the real tootoo.config.js).
  headingFontUrl: 'https://fonts.googleapis.com/css2?family=Rammetto+One&display=swap',
  headingFont: '"Rammetto One", sans-serif',
  sourceRepoUrl: 'https://github.com/pushme-pullyou/tootoo',
  storagePrefix: 'tootoo',
  hiddenFolders: [ 'Images' ],
  hiddenFiles: [],
  maxRepoFiles: 5000,
} );

Object.assign( state, {
  owner: 'pushme-pullyou',
  repo: 'tootoo',
  branch: 'main',
  currentFilePath: '',
  tree: [
    { path: 'README.md', type: 'blob', size: 7234 },
    { path: 'LICENSE', type: 'blob', size: 1064 },
    { path: 'FORKING.md', type: 'blob', size: 7891 },
    { path: 'index.html', type: 'blob', size: 156998 },
    { path: '0-tootoo-agenda.md', type: 'blob', size: 2014 },
    { path: '0-tootoo-journal.md', type: 'blob', size: 8472 },

    { path: 'examples', type: 'tree' },
    { path: 'examples/README.md', type: 'blob', size: 1180 },
    { path: 'examples/logo.svg', type: 'blob', size: 612 },
    { path: 'examples/docs', type: 'tree' },
    { path: 'examples/docs/getting-started.md', type: 'blob', size: 3320 },
    { path: 'examples/docs/api-reference.md', type: 'blob', size: 5210 },
    { path: 'examples/docs/formatting-showcase.md', type: 'blob', size: 4096 },
    { path: 'examples/data', type: 'tree' },
    { path: 'examples/data/sample.csv', type: 'blob', size: 880 },
    { path: 'examples/data/config.json', type: 'blob', size: 412 },
    { path: 'examples/data/settings.yml', type: 'blob', size: 256 },
    { path: 'examples/html', type: 'tree' },
    { path: 'examples/html/sample-page.html', type: 'blob', size: 2200 },
    { path: 'examples/html/legacy-page.htm', type: 'blob', size: 1900 },
    { path: 'examples/code', type: 'tree' },
    { path: 'examples/code/code-sample.js', type: 'blob', size: 1340 },
    { path: 'examples/code/plain.txt', type: 'blob', size: 220 },

    // hidden by CONFIG.hiddenFolders (['Images'] -> 'images') — should NOT show
    { path: 'examples/Images', type: 'tree' },
    { path: 'examples/Images/diagram.png', type: 'blob', size: 50213 },
    { path: 'examples/Images/photo.jpg', type: 'blob', size: 91022 },

    { path: 'src', type: 'tree' },
    { path: 'src/app.js', type: 'blob', size: 9100 },
    { path: 'src/helpers.js', type: 'blob', size: 4300 },

    // dotfolder — should NOT show
    { path: '.github', type: 'tree' },
    { path: '.github/workflows', type: 'tree' },
    { path: '.github/workflows/deploy.yml', type: 'blob', size: 620 },
  ],
} );

/* Mock file CONTENTS (the real app fetches these from GitHub / local disk).
   Keyed by path; the content panel renders by extension. */
const mockFiles = {
  'README.md': `# TooToo

**Navigate any GitHub repo in your browser.** Zero install, single HTML file.

## Features

- Instant cross-tree **filter**
- Markdown, code, image, PDF, and spreadsheet rendering
- Dark mode + font sizing
- Works from \`file://\` next to a local checkout

## A code sample

\`\`\`js
const greet = ( name ) => \`Hello, \${ name }!\`;
console.log( greet( 'TooToo' ) );
\`\`\`

> Try the **Rendered ↔ Raw** toggle (</>), **Copy** (📋), and the breadcrumb above.

See [the agenda](0-tootoo-agenda.md) for what's next, or [the live site](https://pushme-pullyou.github.io/tootoo/).
`,

  'examples/code/code-sample.js': `// A small module to show syntax highlighting.
const fib = ( n ) => {
  const out = [ 0, 1 ];
  for ( let i = 2; i < n; i++ ) out.push( out[ i - 1 ] + out[ i - 2 ] );
  return out.slice( 0, n );
};

export const main = () => {
  console.log( 'first 10 fibonacci:', fib( 10 ) );
};
`,

  'examples/data/config.json': `{
  "appName": "TooToo",
  "theme": { "color": "#2563eb", "dark": false },
  "features": [ "filter", "darkMode", "fontSize" ],
  "maxRepoFiles": 5000
}
`,

  'examples/logo.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
  <rect width="240" height="80" rx="12" fill="#2563eb"/>
  <text x="120" y="52" font-family="system-ui, sans-serif" font-size="34"
        font-weight="700" fill="#fff" text-anchor="middle">TooToo</text>
</svg>
`,
};
