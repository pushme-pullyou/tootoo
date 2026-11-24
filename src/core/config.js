// config.js: the built-in defaults, merged with the page's config block (window.TOOTOO_CONFIG).
//
// - A missing key uses the default.
// - A key the app doesn't know is ignored. Config.unknownKeys() lists them, for About.
// - A key written twice in the block behaves as plain JavaScript: the last one wins.
// - CONFIG is frozen: nothing changes the settings while the app runs.

const Config = {

  defaults: Object.freeze( {
    owner: '', repo: '', branch: '', startFile: '',
    view: 'browser',
    appName: 'TooToo', subtitle: '', description: '',
    themeColor: '', headingFontUrl: '', headingFont: '', bodyFont: '', darkMode: 'auto', faviconFile: '',
    sourceRepoUrl: 'https://github.com/pushme-pullyou/tootoo', homeUrl: '',
    storagePrefix: 'tootoo',
    hiddenFolders: Object.freeze( [] ), hiddenFiles: Object.freeze( [] ),   // the tree always hides index.bak
    hideDatedBackups: true, autoOpenFolderReadme: true,
    rightsText: 'No rights reserved', rightsOwners: null, links: Object.freeze( [] ),
    noindex: false,
    checkForUpdates: true, updateUrl: 'https://pushme-pullyou.github.io/tootoo/releases/latest.json',
  } ),

  // True when the app has a setting by this name (own keys only, so 'toString' is unknown).
  isKnown: ( key ) => Object.hasOwn( Config.defaults, key ),

  // Defaults overlaid with the user's known keys. Arrays are copied, and everything is frozen.
  merge: ( user = {} ) => {
    const settings = { ...Config.defaults };
    for ( const [ key, value ] of Object.entries( user || {} ) ) {
      if ( Config.isKnown( key ) && value !== undefined ) { settings[ key ] = value; }
    }
    for ( const [ key, value ] of Object.entries( settings ) ) {
      if ( Array.isArray( value ) ) { settings[ key ] = Object.freeze( [ ...value ] ); }
    }
    return Object.freeze( settings );
  },

  // The keys in the user's block that the app ignores, e.g. retired 'faviconLetters'.
  unknownKeys: ( user = window.TOOTOO_CONFIG ) => Object.keys( user || {} ).filter( ( key ) => ! Config.isKnown( key ) ),

};

// The settings every part reads.
const CONFIG = Config.merge( window.TOOTOO_CONFIG );
