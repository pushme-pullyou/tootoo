# Tootoo Journal

### 2026-04-09

* Copy TooToo to pushme-pullyou
* 2026-04-09 ~ Copy TooToo over to TooTo folder here ~ name? tootoo-2026?

## 2026-04-03

### Repository Stats
Files 407
Folders 104
Total size 7.5 MB

### Files by type
Extension Count Size
.md       170   393.5 KB
.html     134   1.9 MB
.js       22    71.8 KB
.py       15    39.6 KB

### Largest files
AI_Fluency_vocabulary_cheat_sheet.pdf            1.4 MB
Untitled       1.2 MB
Untitled (1)   1.2 MB
code-clean.jpg 213.8 KB
***

### User Stats

All the items in the GitHub user profile.

###  Contributions
* GitHub style Contributions graphic
* contributions in the last year 6,000

### Achievements

* Total commits 6,452
* Pull requests 11
* Issues opened 4
* Code reviews 0
* Repositories created 3

### Overview
* Public repos 31
* Public gists 23
* Followers146
* Following 133
* Total stars earned ⭐44
* Total forks 🍴 21
* Active last 30 days 5 repos

### Organizations
* freeflightsim
* fgx
* jaanga
* opentecture
* patterns-dev
* absence

### Top languages
Language Repos
* HTML 19
* JavaScript 6

### Recently updated
Repository    Updated
sandbox ⭐1   today
pages ⭐3   3 days ago
2026 ⭐1   6 days ago
2025 ⭐2   9 days ago
wikitheo  22 days ago


## 2026-04-02

### Gemini Prompt Journal

* Build a plain vanilla JavaScript single file app that runs on GitHub Pages.
* The user enters a GitHub owner or user name.
* The app displays a list of repositories for that user.
* When a repository is selected, the files and folders appear in a tree view.
* When the user clicks on a folder or file, it is opened and displayed.
* The app should be responsive and work on both desktop and mobile devices.
* Use the GitHub API to fetch the repositories and their contents.

### test

console.log("escapeHtml:", escapeHtml('<b>"hi"</b>') === '&lt;b&gt;&quot;hi&quot;&lt;/b&gt;' ? "PASS" : "FAIL");
console.log("linkifyAndEscape:", linkifyAndEscape('see https://example.com ok').includes('href="https://example.com"') ? "PASS" : "FAIL");
console.log("formatSize bytes:", formatSize(500) === "500 B" ? "PASS" : "FAIL");
console.log("formatSize KB:", formatSize(2048) === "2.0 KB" ? "PASS" : "FAIL");
console.log("formatSize MB:", formatSize(1500000) === "1.4 MB" ? "PASS" : "FAIL");
console.log("mdToHtml heading:", mdToHtml("# Hello").includes("<h1>") ? "PASS" : "FAIL");
console.log("mdToHtml bold:", mdToHtml("**bold**").includes("<strong>") ? "PASS" : "FAIL");
console.log("Done!");

## 2026-03-31

Currently, Tootoo is being called on the web using this url: https://theo-armour.github.io/sandbox/tootoo/

Because tootoo is in a folder I have been using an index.html in the root folder that redirects down into the subfolder. Unfortunately, this means that any sites that do website previews have almost nothing to display.

What would be an effective way of being able to load tootoo from the root folder? https://theo-armour.github.io/sandbox/ Without copying it to the root folder and renaming it index.html

Let's chat about the options.

***

I think I will copy index.html from tootoo folder to the main root folder.

This will allow me to have the current version and a test version running at the same time. All I need to do is call the different folders.

Can you could add the The intelligence to choose between "./" and "../" to index.html?

## 2026-03-30

In the Sample Folders and Files folder: create a number of folders and files that can be as a testbed for the file tree and content viewer. Include a variety of file types: markdown, images, PDFs, Excel files, and some nested folders. This will allow us to test all the features of the file explorer and content viewer as we build them out.

***

OMG! The jumps today with Claude playing with tootoo are just phenomenal.
I can now look at almost every file I've ever put up on GitHub under my own name in seconds.

Seeing that a file is broken or does not work, I can probably get Claude to fix it.
