# Monorepo Example

A cross-language monorepo with a **Node.js frontend** and a **Python backend**, sharing a single CI workflow that uses path filtering and working-directory defaults.

## Structure

```
monorepo/
├── .github/workflows/
│   └── ci.yml              ← One workflow for both projects
├── frontend/               ← Node.js app
│   ├── package.json
│   ├── index.js
│   └── index.test.js
├── backend/                ← Python app
│   ├── pyproject.toml
│   ├── src/api.py
│   └── tests/test_api.py
└── README.md
```

## How it works

```
Push to main
    │
    ├── Changed: frontend/index.js?
    │   └── Yes → frontend job runs (Node.js CI)
    │
    ├── Changed: backend/src/api.py?
    │   └── Yes → backend job runs (Python CI)
    │
    └── Changed: only README.md?
        └── Neither runs (path filter skips it)
```

Both jobs run in **parallel** since they have no `needs` dependency between them.

## Key concepts

| Concept | Where to look |
|---------|--------------|
| Path filtering on triggers | `ci.yml` lines 18-21, 24-28 |
| `defaults.run.working-directory` per job | `ci.yml` lines 36-37, 55-56 |
| `cache-dependency-path` for subdirectory cache | `ci.yml` line 43 |
| Node + Python in the same workflow | `ci.yml` jobs `frontend` + `backend` |
| Non-JS linting with Ruff action | `ci.yml` lines 65-67 |
| `src:` parameter on ruff-action for subdirectory | `ci.yml` line 68 |

## Why monorepo patterns matter

Without path filtering, every push runs the full test suite — even for a docs-only change. Without `working-directory` defaults, every `run:` command needs `working-directory: ./frontend` or `cd frontend`, creating noisy, error-prone YAML.

## When to split workflows

For larger monorepos (10+ projects), prefer **separate workflow files** per project:

```
.github/workflows/
├── frontend-ci.yml     ← paths: frontend/**
├── backend-ci.yml      ← paths: backend/**
├── e2e.yml             ← paths: e2e/**
└── deploy.yml          ← triggers on release, deploys all
```

This keeps each file short and prevents a single workflow from becoming a dumping ground.
