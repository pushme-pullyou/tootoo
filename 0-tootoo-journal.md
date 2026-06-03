# TooToo — Development Journal

## 2026-06-02

* 2026-05-31 ~ Update tips & why pages
* 2026-06-02 ~ tidy the sample files.
* 2026-06-02 ~ Sidebar header: folders and files and sizes
* 2026-05-26 ~ support printing the current file with a clean print stylesheet

***

Here is my previous prompt for index.html:

"this file is going to be quite large and complicated. Is there any place where we can streamline or simplify it?"

You worked for a long time on this and came up with a new index.html that is the same size as the earlier version - index-2026-06-01-22-49.html. And it seems to display the same error of displaying an HTML file using raw GitHub user content.

Review and comment on this situation.

## 2026-05-28

* 2026-05-28 ~ Add hiddenFiles ~ for tootoo.config.sys etc
* 2026-05-28 ~ Links in theme colors

  'G:\My Drive\2026-theo-github\heritage-happenings.github.io'
  'G:\My Drive\2026-theo-github\pushme-pullyou-github'
  'G:\My Drive\2026-theo-github\pushme-pullyou-assets'
  'G:\My Drive\2026-theo-github\theo-armour-2025'
  'G:\My Drive\2026-theo-github\theo-armour-2026'
  'G:\My Drive\2026-theo-github\theo-armour-agenda'
  'G:\My Drive\2026-theo-github\theo-armour-aa'
  'G:\My Drive\2026-theo-github\theo-armour-genealogy'
  'G:\My Drive\2026-theo-github\theo-armour-pages'
  'G:\My Drive\2026-theo-github\theo-armour-qdata'
  'G:\My Drive\2026-theo-github\theo-armour-sandbox'
  'G:\My Drive\2026-theo-github\theo-armour-wikitheo'
  'I:\My Drive\tech'

For all these repos, to their tootoo.config.js file add:
 subtitle: 'a GitHub repository browser',
 headingFontUrl: 'https://fonts.googleapis.com/css2?family=Patua+One&display=swap',
  headingFont: '"Patua One", serif',
  hiddenFiles: [ 'tootoo.config.js' ],
  hiddenFolders: [ 'Images' ],

## 2026-05-26

currently the current url used when reloading is being saved to local storage. I think this can be confusing to a user who's not been to the site for a while. What would that be a more normal way of handling reloading?

* 2026-05-26 ~ theming
* 2026-05-26 ~ Add a favicon for each repo, using the GitHub organization avatar if available, otherwise a default icon.
* 2026-05-26 ~ Config in external file.
* 2026-05-26 ~ support for the linux repo
* 2026-05-26 ~ Reload last page and file in the sidebar, and open it on load. Store in session storage.
* 2026-05-25 ~ Files with no extension are sent to a new tab.
* Favicon to GitHub organization
* User theming
* Make sure all the different code sections are relevant and are factual.
* That the numbering of sections is relevant

## 2026-05-25

* 2026-05-19 PDF opens in new tab instead of downloading
* Add keystroke to initiate sidebar scrolling
* 2026-05-19 file size slides under filename, not in a separate column
* Add a footer to the sidebar with copyright and license info, and a link go to top

## 2026-04-26

## Why TooToo?

A blog post for each
* Run a large and maintain a large number of site
* Archivable
* Free, open source, no vendor lock-in
* No backend, no database, no server costs
* Can be used for any repository, not just GitHub Pages
* Can be used for any branch, not just the default branch
* Can be used for any file, not just markdown files
* Can be used for any repository, not just the user's own repositories
* Can be used for any repository, not just public repositories
* Easy-peasy code ~ no dev-ops skills required
* Fast and responsive, even with large repositories
* Can be used offline, without an internet connection
* Same code everywhere


## 2026-04-25

* Set up a blog
* emphasize cursor keys
* Explain no file editor
* figure out How to handle huge numbers of files like in Linux.

### Done

* Many changes ~ looking good
* Moved tootoo not "LT" to its own repo: gubgub
* cleaned up folders
* tags added: github-pages-website repository-browser markdown-viewer vanilla-javascript
single-file github-api static-site markdown
* https://chatgpt.com/s/m_69eda263d77881918084f5310fa3f661
* https://chatgpt.com/s/m_69eda33430108191a961e493c5486b4e

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
