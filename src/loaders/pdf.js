// pdf.js: PDF in the browser's own viewer, in a frame.

const PdfLoader = {

  extensions: [ 'pdf' ],

  render: async ( file, element ) => {
    const frame = document.createElement( 'iframe' );
    frame.className = 'pdf-view';
    frame.title = file.name;
    frame.src = await Loaders.urlFor( file.source, file.path );
    element.replaceChildren( frame );
  },

};
