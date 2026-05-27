// TooToo per-fork configuration.
//
// Drop this file next to index.html and set the knobs you want to override.
// Anything you set here wins over the built-in CONFIG block in index.html,
// so forks can stay byte-identical to canonical and sync with `cp`.
//
// All keys are optional — leave a key out (or assign '') to keep the default.

window.TOOTOO_CONFIG = {

  // ── Repo to browse ──────────────────────────────────────────────────────
  // Leave empty to auto-detect from URL params, GitHub Pages subdomain,
  // .git/config (file:// only), or the manual repo form.
  // owner: 'theo-armour',
  // repo: 'agenda',
  // branch: '',

  // ── Identity ────────────────────────────────────────────────────────────
  // appName        : drives <title>, the header text, and the About heading
  // storagePrefix  : localStorage namespace; pick a unique value per fork
  //                  so each fork's state stays separate
  // sourceRepoUrl  : top-header GitHub icon target and About "Source code"
  //                  link; point this at your fork
  // appName: 'My Journal',
  // storagePrefix: 'my-journal',
  // sourceRepoUrl: 'https://github.com/me/my-journal',

  // ── Branding (this is what makes forks look different) ──────────────────
  // themeColor     : hex string; sets --highlight-color in both light AND
  //                  dark mode
  // subtitle       : small muted text appended to the header title with a
  //                  middle-dot separator
  // faviconLetters : two characters drawn into the SVG favicon; uppercased
  // faviconColor   : background color of the SVG favicon
  // themeColor: '#3a8856',
  // subtitle: 'Daily journal entries',
  // faviconLetters: 'MJ',
  // faviconColor: '#3a8856',

  // ── Browsing behavior ───────────────────────────────────────────────────
  // hiddenFolders : folder names to omit from the sidebar tree
  //                 (case-insensitive, matches at any depth)
  // maxRepoFiles  : refuse to render repos bigger than this; the
  //                 friendly bail-out panel also fires on any truncated
  //                 GitHub tree response
  // hiddenFolders: [ 'Images', 'drafts' ],
  // maxRepoFiles: 5000,

};
