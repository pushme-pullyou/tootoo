// TooToo — per-fork configuration.
// Sits next to index.html; window.TOOTOO_CONFIG overrides the built-in CONFIG at init,
// so every index.html stays byte-identical across forks. All keys are optional —
// omit one to keep canonical's default. (Fuller docs: FORKING.md.)

window.TOOTOO_CONFIG = {

  // ── Repo to browse ── omit to auto-detect (URL params, *.github.io host, .git/config, manual form)
  // owner: 'theo-armour',
  // repo: 'pages',
  // branch: '',          // empty = the repo's default branch

  // ── Identity ──
  // appName: 'TooToo',                                          // <title>, header text, About heading
  // storagePrefix: 'tootoo',                                    // localStorage namespace — unique per fork
  // sourceRepoUrl: 'https://github.com/pushme-pullyou/tootoo',  // header GitHub icon + About link

  // ── Branding ──
  themeColor: '#3a8856',                              // --highlight-color (light + dark)
  subtitle: 'Single-file GitHub repository browser',  // muted text after the title
  faviconLetters: 'tt',                               // 2 letters in the generated SVG favicon
  faviconColor: '#3a8856',                            // favicon background
  // faviconFile: 'favicon.ico',                      // use a real favicon.ico instead of the generated mark
  headingFontUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&display=swap',
  headingFont: '"Fraunces", serif',                   // applied to every heading + the title

  // ── Browsing ──
  // hiddenFolders: [ 'Images' ],                      // folder names to hide (any depth)
  // hiddenFiles: [ 'tootoo.config.js' ],              // file names to hide; '/name' anchors to the repo root
  // maxRepoFiles: 5000,                               // refuse to render repos larger than this

};
