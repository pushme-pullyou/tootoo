# TooToo LT — Development Journal


## 2026-04-22




## 2026-04-10

* 2026-04-10 ~ multiple locations
* 2026-04-10 ~ Add footer
* 2026-04-07 ~ Style adjustments
* 2026-04-10 ~ Use GitHub markdown
* 2026-04-06 ~ new tab: if not pages, use raw

## 2026-04-09

* 2026-04-08 ~ Add repo date to info page
* 2026-04-07 ~ "?" about button
* 2026-04-07 ~ is sheetjs needed? yes
* 2026-04-06 ~ Move LT to its own repo
* 2026-04-06 ~ LT: repo stats, but only for the current repo. No orgs, gists, or other repos.

## 2026-04-07

* 2026-04-07 ~ Text size control
* 2026-04-07 ~ "Files" is sticking to top

https://theo-armour.github.io/sandbox/tootoo/tootoo-lt/1-layout/tootoo-lt-layout.html?owner=obadawy&repo=lmsgsrv

Ignore the copilot-instructions.md rule about reading nearby code.

## 2026-04-06

tootoo-lt.html?owner=theo-armour&repo=sandbox — uses default branch
tootoo-lt.html?owner=theo-armour&repo=sandbox&branch=main — specific branch
tootoo-lt.html?owner=theo-armour&repo=sandbox#README.md — opens a specific file

https://theo-armour.github.io/sandbox/tootoo/tootoo-lt/tootoo-lt.html?owner=obadawy&repo=lmsgsrv

https://theo-armour.github.io/sandbox/tootoo/tootoo-lt/tootoo-lt.html?owner=theo-armour&repo=aa

<meta name="revised" content="Sunday, July 18th, 2023, 5:15 pm" />

### Done

* TooToo LT for single website or even a single user
* 2026-04-06 ~ a tooltip somewhere saying the date and time of the last update.
* left width a % on mobile
* 2026-04-06 ~ vertical bar always visible, even when not hovering

## 2026-04-05

So what's next? Go from TooToo LT back to the big Tootoo.

Add repo stats to LT. no. Keep LT very basic.



***

Again, What amazing progress!

I would like to be able to drop TooToo-LT.html into any local repository folder and have it configure itself or detect the repository it is in and automatically set `CONFIG.owner` and `CONFIG.repo` accordingly.

Can you think of ways to do this?

--allow-file-access-from-files

### Done
* Let files that stream of any size run without prompting.
* OK to load large files that stream
* Smaller file size margins
* Shorter location.hash
* How to get a gat?
* PDFs load OK locally
* If a repository is private, inform the user That the repository is private and prompt them to enter a token in order to view files.
## 2026-04-04

I want to build, create the prompt for a light version or LT version of `index.html`.

It loads and displays the files in a single repository the primary branch.

It does not include the full repo list, orgs, gists, or stats — just the tree and file content for the selected repo's default branch.

The UI will therefore be simplified: the header will only have the owner/repo input fields and the token button. The sidebar will only show the tree for the selected repo/branch, and the content area will render the selected file. All other features from the full TooToo index.html — repo list, orgs, gists, stats — are omitted.

The prompt for the LLM will therefore describe this simplified LT version: it should instruct the model to generate a single `tootoo-lt.html` file that only implements tree sidebar for the selected repo, and content area for the selected file, omitting all other features from the full TooToo app.

Ask any clarifying questions one at a time.
