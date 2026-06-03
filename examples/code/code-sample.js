// Sample JavaScript file
// Tests raw code display in the content viewer

const CONFIG = {
  owner: "theo-armour",
  repo: "sandbox",
  branch: "main"
};

const getApiUrl = ( owner, repo, branch ) =>
  `https://api.github.com/repos/${ owner }/${ repo }/git/trees/${ branch }?recursive=1`;

const fetchTree = async () => {
  const url = getApiUrl( CONFIG.owner, CONFIG.repo, CONFIG.branch );
  const response = await fetch( url );
  if ( !response.ok ) throw new Error( `HTTP ${ response.status }` );
  const data = await response.json();
  return data.tree;
};

// File type detection
const getFileType = ( filename ) => {
  const ext = filename.split( "." ).pop().toLowerCase();
  const types = {
    md: "markdown",
    json: "data",
    yml: "config",
    html: "web",
    css: "style",
    js: "script",
    svg: "image",
    png: "image",
    jpg: "image",
    pdf: "document",
  };
  return types[ ext ] ?? "unknown";
};

export { CONFIG, fetchTree, getFileType };
