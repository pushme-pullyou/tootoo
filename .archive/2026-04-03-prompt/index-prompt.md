# TooToo — Prompt Guide

## What This Is

TooToo is a single-file HTML GitHub browser. One `index.html`, zero build tools, vanilla JS only.
It runs on GitHub Pages at `theo-armour.github.io/sandbox/` and `theo-armour.github.io/sandbox/tootoo/`.

This prompt guide is split across multiple files so each concern can be iterated independently.

## Prompt Files

| File | Covers |
|------|--------|
| `index-prompt.md` | This overview — purpose, constraints, how to use the prompts |
| `prompt-architecture.md` | Layout, state management, CSS, HTML structure |
| `prompt-github-api.md` | All GitHub API interactions — repos, orgs, gists, stats, tree, file content |
| `prompt-file-viewer.md` | Content rendering — markdown, code, images, media, HTML iframes |
| `prompt-navigation.md` | Hash routing, deep linking, sidebar tree, keyboard navigation, filtering |
| `prompt-discover.md` | Discover page — random user, curated lists, top followed search |

## How to Use These Prompts

**For a full rebuild**: Concatenate all prompt files and feed to the LLM:
> "Using the following specs, create a single `index.html` file: [paste all prompt files]"

**For a targeted fix**: Feed only the relevant prompt file(s) plus the current `index.html`:
> "Here is my current app [paste index.html]. Using this spec [paste prompt-file-viewer.md], fix the markdown rendering."

**For adding a feature**: Write a new prompt file, feed it with `prompt-architecture.md` for context:
> "Here is my app's architecture [paste prompt-architecture.md]. Add this feature: [paste new prompt]."

## Hard Constraints (apply to ALL prompt files)

- **Single file**: Everything in one `index.html` — HTML, CSS, JS inline
- **Vanilla JS only**: No frameworks, no jQuery, no build tools, no Node.js
- **ES2020+ features**: `const`/`let` (no `var`), arrow functions, template literals, async/await, optional chaining
- **Functional style**: No classes, no `this` keyword
- **Static hosting**: Must work on GitHub Pages and by opening the file locally
- **External deps allowed**: `marked.js` (CDN) for markdown, `highlight.js` (CDN) for syntax highlighting
- **Security**: All user-supplied strings escaped via `escapeHTML()` / `escapeAttribute()` before insertion into DOM
- **Beginner-readable**: If a student can't follow it, simplify

## Multi-Repo Sync

Three copies of TooToo exist and must stay in sync:
- `theo-armour/sandbox` → `index.html` (root) + `tootoo/index.html`
- `theo-armour/work` → `index.html`

They differ only in initial CONFIG values. Apply fixes to all three.

## Current App Stats (for reference)

- ~1500 lines of HTML/CSS/JS
- 10+ major features (repos, orgs, gists, stats, tree, file viewer, discover, filtering, sorting, keyboard nav)
- Uses GitHub REST API v3 (unauthenticated or with personal access token)
