# API Reference

## Endpoints

### GET /repos/{owner}/{repo}/git/trees/{branch}

Fetches the full repository tree.

**Parameters:**

| Parameter | Type   | Description          |
|-----------|--------|----------------------|
| owner     | string | Repository owner     |
| repo      | string | Repository name      |
| branch    | string | Branch name          |
| recursive | int    | Set to 1 for full tree |

**Response:**

```json
{
  "sha": "abc123",
  "tree": [
    { "path": "README.md", "type": "blob" },
    { "path": "docs", "type": "tree" }
  ]
}
```

### Authentication

Include an `Authorization` header for private repos:

```
Authorization: token ghp_xxxxxxxxxxxx
```

## Error Codes

- **200** — Success
- **401** — Bad credentials
- **404** — Not found (repo may be private)
- **403** — Rate limited

---

*See [GitHub REST API docs](https://docs.github.com/en/rest) for more details.*
