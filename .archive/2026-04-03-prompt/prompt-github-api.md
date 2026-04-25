# TooToo — GitHub API Interactions

## Authentication

- Optional GitHub Personal Access Token for higher rate limits and private repo access
- Stored in `localStorage` under `githubToken`
- Sent as `Authorization: token <value>` header on all API requests
- Token UI: "⚙️ Token" button opens a `prompt()` dialog; blank clears the token; page reloads after change

## Fetching Repositories

- Endpoint: `GET /users/{owner}/repos?per_page=100&sort=updated&page={n}`
- Paginated: if 100 items returned, show "Load More Repos" button for next page
- Each repo item displays: name, star count, language (with colored dot), GitHub Pages indicator (🌐), and relative time since last push
- Repos cached in `state.repoItems` for client-side re-sorting
- Sort options: Recently Updated (default), Stars, Name, Last Push, Size

### Language Colors

Map of ~30 popular languages to their GitHub-style dot colors (e.g., JavaScript → `#f1e05a`, Python → `#3572A5`).

## Fetching Organizations

- Endpoint: `GET /users/{owner}/orgs?per_page=100&page={n}`
- Clicking an org sets the owner input and fetches that org's repos

## Fetching Gists

- Endpoint: `GET /users/{owner}/gists?per_page=100&page={n}`
- Gist items show description (or first filename as fallback)
- Selecting a gist fetches full gist data: `GET /gists/{id}`
- Gist files are mapped to `state.tree` with `type: 'blob'` and `raw_url` for direct content fetch

## Fetching Stats

Stats adapt based on context:

### User-Level Stats
- Endpoint: `GET /users/{owner}`
- Shows: avatar, name, bio, location, followers, following, public repos, public gists, join date
- Displayed as a card with grid layout

### Repo-Level Stats
- Endpoint: `GET /repos/{owner}/{repo}`
- Shows: avatar, full name, description, stars, watchers, forks, open issues, language, license, created/updated dates, size, homepage, pages status
- Also fetches `GET /repos/{owner}/{repo}/languages` for a language breakdown with percentage bars

## Fetching Repository Tree

- On repo select: first fetch `GET /repos/{owner}/{repo}` to get default branch
- Then fetch branches: `GET /repos/{owner}/{repo}/branches?per_page=100` for branch selector dropdown
- Then fetch tree: `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`
- If `treeData.truncated` is true, show a yellow warning banner
- Tree items stored in `state.tree` array

## Fetching File Content

- Repo files: `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`
- Gist files: use the `raw_url` from the gist API response
- Large files (>1MB): show a confirm dialog before loading
- Approved large files tracked in an in-memory `Set` to avoid repeat prompts

## Rate Limiting

- Unauthenticated: 60 requests/hour
- Authenticated: 5,000 requests/hour
- 403 errors include a hint to add a token
- All fetches share a single `AbortController` — starting a new action cancels any in-flight request

## Recent Users

- Owner input has a `<datalist>` with up to 10 recent usernames
- Updated on successful fetch; stored in `localStorage` as JSON array
- Input clears on focus, triggers fetch on `change` event
