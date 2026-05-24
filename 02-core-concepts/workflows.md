# Workflows

A **workflow** is a configurable automated process defined by a YAML file in your repository's `.github/workflows/` directory. It is the top-level unit in GitHub Actions.

## Anatomy of a workflow

```yaml
name: CI                         # optional display name
on:                              # event triggers
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:                            # one or more jobs
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm test
```

See a complete working example: [examples/nodejs-app/.github/workflows/ci.yml](../examples/nodejs-app/.github/workflows/ci.yml)

## Key characteristics

- A repo can have **multiple workflows** — each file in `.github/workflows/` is a separate workflow
- Workflows can be **triggered** by GitHub events (push, PR, issue), scheduled (cron), manually (`workflow_dispatch`), or called from another workflow
- Each workflow run is **isolated** — it gets a fresh virtual machine with a clean filesystem
- Workflows can interact across repos using `repository_dispatch` or reusable workflows

## Where workflows live

```
my-repo/
└── .github/
    └── workflows/
        ├── ci.yml
        ├── deploy.yml
        └── nightly-scan.yml
```

GitHub discovers and registers any `.yml` or `.yaml` file in this directory automatically.

---

[← Back to index](../index.md)
