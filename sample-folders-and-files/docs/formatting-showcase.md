# Formatting Showcase

This file tests all inline markdown features.

## Text Styles

This is **bold text** and this is *italic text*.

This is **also bold** and *also italic*.

This is ~~strikethrough~~ text.

Combine them: ***bold and italic***, ~~**bold strikethrough**~~.

## Inline Code

Use `const x = 42;` for inline code.

The function `mdToHtml()` converts markdown to HTML.

## Links

- [GitHub](https://github.com)
- [Example Site](https://example.com)
- A plain URL: https://theo-armour.github.io/sandbox/

## Images

Here's a reference to a sample SVG:

![Sample Logo](../images/logo.svg)

## Fenced Code Blocks

```js
const greet = (name) => {
  console.log(`Hello, ${name}!`);
};
greet("World");
```

```css
.tree-item {
  padding: 6px 16px;
  cursor: pointer;
  transition: background 0.1s;
}
```

## Lists

### Unordered

- First item
- Second item
- Third item

### Ordered

1. Step one
2. Step two
3. Step three

## Horizontal Rules

---

***

___

## Headings

### H3 Heading
#### H4 Heading
##### H5 Heading
###### H6 Heading

## Paragraphs

This is a paragraph with multiple sentences. It should wrap naturally in the content viewer. The markdown renderer collects consecutive lines into a single paragraph element.

This is a second paragraph, separated by a blank line.
