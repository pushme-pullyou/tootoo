# Hash fragment bug repro

This file reproduces the issue where a fragment becomes part of the file path and causes a failed load.

## demo-anchor

If the app decodes `%23` into `#` too early, it may try to fetch this as a literal file path:

- `tootoo-dev/hash-fragment-bug-repro.md#demo-anchor`

Instead of loading `tootoo-dev/hash-fragment-bug-repro.md` and then scrolling to `#demo-anchor`.

### Trigger links

- Normal in-file fragment (should be fine in markdown): [jump to demo anchor](#demo-anchor)
- **Bug trigger** (encoded fragment in path): [open with encoded fragment](hash-fragment-bug-repro.md%23demo-anchor)

### Manual URL test

You can also paste this into the address bar while viewing TooToo:

- `#tootoo-dev/hash-fragment-bug-repro.md%23demo-anchor`

Expected behavior:

1. File opens
2. App scrolls to `demo-anchor`

Current buggy behavior (issue #1):

1. App tries to load a file path that includes `#demo-anchor`
2. File fetch fails
