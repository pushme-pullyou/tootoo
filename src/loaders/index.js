// index.js: the loaders (Stage 4 brings the extension table and libraries on demand).
// For now, a stub: every file as plain text.

const Loaders = {

  canToggle: () => false,

  render: async ( file, element ) => {
    const pre = document.createElement( 'pre' );
    pre.className = 'text-view';
    pre.textContent = await file.source.readText( file.path );
    element.replaceChildren( pre );
  },

};
