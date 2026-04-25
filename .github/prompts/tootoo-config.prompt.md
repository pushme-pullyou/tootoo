---
mode: ask
description: Generate a pre-configured TooToo instance for a specific GitHub repo
---

# TooToo Config

Generate a copy of the current root `index.html` pre-configured for the following repository:

- **owner**: ${input:owner:GitHub username or org, e.g. theo-armour}
- **repo**: ${input:repo:Repository name, e.g. pages}
- **branch**: ${input:branch:Branch name (default: main):main}

Only change the `CONFIG` object at the top of the script — set `owner`, `repo`, and `branch` to the values above. Leave all other code unchanged.

If working inside this repo, read `index.html` from the repository root. Save the result as `index.html` in the current folder (or the location the user specifies).
