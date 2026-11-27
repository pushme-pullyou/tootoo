# HTML

Web pages running in a frame. On the repo's own Pages site, or from a folder opened beside this page, the frame loads the real page. Anywhere else it gets a copy, which is sandboxed: its scripts run, but it can't reach TooToo's own storage, and its relative links and images may not load.

- [sample-page.html](sample-page.html): a small script shows the current time, so you can see scripts run
- [markdown-help.html](markdown-help.html): an ordinary page
- [legacy-page.htm](legacy-page.htm), [style-sample.htm](style-sample.htm): the `.htm` ending works too
- [style-sample-tags.html](style-sample-tags.html): many kinds of element on one page
- [text-to-hack.htm](text-to-hack.htm), [text-to-hack-3.html](text-to-hack-3.html): bare fragments with no `<html>` or `<head>`, shown anyway. The same text, one `.htm` and one `.html`
- [samples/](samples/): more pages, one folder down
