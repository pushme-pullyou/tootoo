// media.js: images, SVG (with a Raw view of its source), audio and video.

const MediaLoader = {

  extensions: [ 'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'ico', 'svg',
    'mp3', 'wav', 'ogg', 'm4a', 'flac', 'mp4', 'webm', 'ogv', 'mov' ],
  audio: [ 'mp3', 'wav', 'ogg', 'm4a', 'flac' ],
  video: [ 'mp4', 'webm', 'ogv', 'mov' ],

  toggle: ( ext ) => ext === 'svg',

  render: async ( file, element ) => {
    const url = await Loaders.urlFor( file.source, file.path );
    const tag = MediaLoader.audio.includes( file.ext ) ? 'audio' : MediaLoader.video.includes( file.ext ) ? 'video' : 'img';
    const media = document.createElement( tag );
    media.className = 'media-view';
    media.src = url;
    if ( tag === 'img' ) { media.alt = file.name; } else { media.controls = true; }
    element.replaceChildren( media );
  },

};
