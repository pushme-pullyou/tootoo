---
mode: ask
description: Generate a pre-configured TooToo LT instance for a specific GitHub repo
---

Generate a copy of `tootoo-2026-lt/index.html` pre-configured for the following repository:

- **owner**: ${input:owner:GitHub username or org, e.g. theo-armour}
- **repo**: ${input:repo:Repository name, e.g. pages}
- **branch**: ${input:branch:Branch name (default: main):main}

Only change the `CONFIG` object at the top of the script — set `owner`, `repo`, and `branch` to the values above. Leave all other code unchanged.

Save the result as `index.html` in the current folder (or the location the user specifies).
