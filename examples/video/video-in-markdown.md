# Video in Markdown

A Markdown page can show a video with an HTML `<video>` tag. The path is relative to this page, as for an image.

<video controls style="max-width: 100%">
  <source src="pano.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

The tag used above:

```html
<video controls style="max-width: 100%">
  <source src="pano.mp4" type="video/mp4">
</video>
```
