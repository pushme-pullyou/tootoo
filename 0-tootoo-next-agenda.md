# TooToo Next Agenda

## Header title

Settled 2026-11-22, and added to [SPEC.md](SPEC.md) §6 (Header). For the next release.

**Left to right:**

1. **Icon:** the `faviconFile` image; when none is set, a small GitHub mark. It links to the repo on GitHub: `https://github.com/<owner>/<repo>`.
2. **Owner:** the owner's GitHub login as-is (e.g. `pushme-pullyou`), linking to their home page: `https://<owner>.github.io`.
3. **Repo:** the repo name, linking to its Pages site: `https://<owner>.github.io/<repo>`. Always the Pages URL; checking whether the repo has Pages stays "Later".
4. **App name:** `appName` from the settings block (e.g. "TooToo Next"), linking back to the start: this page with no file open. Left out when it only repeats the repo name ("TooToo Next" after `tootoo-next`, ignoring case, spaces and punctuation).
5. **Subtitle:** `subtitle`, as today.

**The owner's own site repo** (`<owner>/<owner>.github.io`): leave out the repo; show only the owner, linking to `https://<owner>.github.io`. Example: [pushme-pullyou](https://pushme-pullyou.github.io).

**Local folders:**

* A clone of a GitHub repo: owner / repo links as usual, with 📂 in front to show the files come from disk.
* No GitHub repo: 📂 and the folder name in place of owner / repo, with no links.

**No repo known:** owner and repo are left out, and the icon links nowhere.

## File header: the file on GitHub

Settled 2026-11-22, and added to [SPEC.md](SPEC.md) §6 (File header). For the next release.

* A small GitHub mark before the breadcrumbs, linking to the open file on GitHub: `https://github.com/<owner>/<repo>/blob/<branch>/<path>` (`HEAD` when no branch is set). Same tab.
* The breadcrumbs drop the repo name at the start (the mark leads to the repo): `folder / … / file`. Folders still link to their README.
* **↗ New tab** stays: it opens the raw file, this opens the GitHub page.
* A local clone links to the pushed file, titled "on GitHub (may differ from your local copy)". No GitHub repo, no mark.
