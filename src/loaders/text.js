// text.js: plain text, and any unknown type that turns out to be text.

const TextLoader = {

  extensions: [ 'txt', 'text', 'log' ],

  render: async ( file, element ) => {
    const pre = document.createElement( 'pre' );
    pre.className = 'text-view';
    pre.textContent = await file.source.readText( file.path );
    element.replaceChildren( pre );
  },

};
