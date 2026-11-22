// code.js: source code, highlighted by highlight.js (loaded the first time it's needed).
// Also the Raw view of Markdown, HTML, CSV and SVG. Colors come from styles.css, so they follow dark mode.

const CodeLoader = {

  extensions: [ 'js', 'mjs', 'cjs', 'ts', 'json', 'css', 'scss', 'less', 'py', 'rb', 'java', 'c', 'h', 'cpp', 'cs',
    'go', 'rs', 'php', 'sh', 'bash', 'ps1', 'bat', 'yml', 'yaml', 'toml', 'ini', 'xml', 'sql', 'lua', 'r', 'swift', 'kt',
    'pl', 'diff', 'graphql', 'gitignore', 'gitattributes', 'editorconfig' ],

  library: [ 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/highlight.min.js' ],

  // File extension → highlight.js language, where the names differ.
  languages: { js: 'javascript', mjs: 'javascript', cjs: 'javascript', ts: 'typescript', py: 'python', rb: 'ruby',
    h: 'c', cs: 'csharp', rs: 'rust', sh: 'bash', ps1: 'powershell', bat: 'dos', yml: 'yaml', kt: 'kotlin', pl: 'perl',
    md: 'markdown', markdown: 'markdown', html: 'xml', htm: 'xml', svg: 'xml', toml: 'ini', csv: 'plaintext', tsv: 'plaintext' },

  // Colors the text of a <code> block, when highlight.js is loaded and knows the language.
  highlight: ( code, extOrLanguage ) => {
    const language = CodeLoader.languages[ extOrLanguage ] || extOrLanguage;
    if ( ! window.hljs || ! language || ! window.hljs.getLanguage( language ) ) { return; }
    code.innerHTML = window.hljs.highlight( code.textContent, { language, ignoreIllegals: true } ).value;
    code.classList.add( 'hljs' );
  },

  render: async ( file, element ) => {
    const pre = document.createElement( 'pre' );
    const code = document.createElement( 'code' );
    pre.className = 'code-view';
    code.textContent = await file.source.readText( file.path );
    CodeLoader.highlight( code, file.ext );
    pre.append( code );
    element.replaceChildren( pre );
  },

};
