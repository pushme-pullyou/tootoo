# TooToo — Discover Feature

## Purpose

The Discover page helps users find interesting GitHub accounts when they don't know who to search for. Accessed via the "🌍 Discover" button in the header (styled dark background for visual emphasis).

## UI Layout

A centered card (max-width 800px) with three sections:

### 1. Roll the Dice — Random User
- Large "Surprise Me (Random User)" button (dark background)
- `handleRandomUser()`: generates a random ID (1 to 100M), fetches `GET /user/{id}`
- Tries up to 8 attempts (many IDs are deleted/suspended and return 404)
- On success: sets owner input and fetches repos
- On failure after all attempts: shows error message

### 2. Curated Suggestions
Three categorized groups of notable GitHub accounts:

| Category | Users |
|----------|-------|
| Creative Coding & 3D | mrdoob, pmndrs, greggman, d3, playcanvas |
| Massive Orgs | microsoft, google, nasa, vercel, freeCodeCamp |
| Prolific Devs | sindresorhus, tj, torvalds, ruanyf, gaearon |

- Each user is a button; clicking sets the owner and fetches repos
- Styled as pill buttons with hover highlight

### 3. API Search — Top Followed Users
- "Fetch Top Followed Global Users" button
- `handleSearchTopUsers()`: calls `GET /search/users?q=followers:>20000&sort=followers&order=desc&per_page=30`
- Results displayed as a responsive grid of cards, each showing:
  - Avatar (64px, rounded)
  - Username (bold, blue)
- Clicking a card sets the owner and fetches repos

## Navigation
- When Discover is active:
  - Sidebar (repo list and tree) is hidden
  - Orgs/Gists buttons are hidden
  - Main action button becomes "← Back to Search"
- Back button restores previous state or returns to repo list
