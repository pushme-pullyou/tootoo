// fake-library.js: stands in for a CDN library, so a test can count how often it loads.
window.fakeLibraryLoads = ( window.fakeLibraryLoads || 0 ) + 1;
