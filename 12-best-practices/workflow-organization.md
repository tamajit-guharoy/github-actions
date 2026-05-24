# Workflow Organization

A well-organized `.github/workflows/` directory is easier to navigate, debug, and maintain. These conventions scale from a single repo to a monorepo with dozens of workflows.

---

## Naming conventions

### Workflow files

| Pattern | Example | Use for |
|---------|---------|---------|
| `<action>.yml` | `ci.yml`, `deploy.yml`, `lint.yml` | Single-purpose workflow |
| `<action>-<target>.yml` | `deploy-staging.yml`, `deploy-production.yml` | Per-environment variants |
| `<event>-<action>.yml` | `pr-labeler.yml`, `push-build.yml` | Event-triggered workflows |
| `<schedule>-<task>.yml` | `nightly-scan.yml`, `weekly-cleanup.yml` | Scheduled workflows |

Bad names: `test.yml` (too generic), `workflow.yml` (says nothing), `ci-new-version-2-final.yml` (please don't).

### Workflow `name:` in YAML

The `name:` key appears in the Actions tab. Make it human-readable:

```yaml
# Good
name: Nightly Security Scan

# Bad
name: sec-scan
```

---

## One workflow per concern

A workflow file should do one thing:

```
✅ ci.yml                    — lint, test, build
✅ deploy-staging.yml        — deploy to staging
✅ nightly-scan.yml          — security + dependency audit

❌ everything.yml             — lint, test, deploy-staging, deploy-prod,
                                nightly scan, label PRs, close stale issues...
```

Why one concern per file:
- **Trigger control**: CI runs on PRs; deploy runs on `main`. Different `on:` blocks.
- **Concurrency**: Each file gets its own concurrency groups.
- **Readability**: A 50-line workflow is skimmable; a 500-line one is not.
- **Blast radius**: A broken deploy workflow shouldn't block CI.

---

## Shared logic: reusable workflows and composite actions

When the same steps appear in 3+ workflows, extract them.

### Composite action (same steps, same job)

```yaml
# .github/actions/setup-and-test/action.yml
runs:
  using: 'composite'
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
      shell: bash
    - run: npm test
      shell: bash
```

### Reusable workflow (different jobs, different runners)

```yaml
# .github/workflows/_deploy.yml
on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
    secrets:
      DEPLOY_KEY:
        required: true
```

Prefix reusable workflow filenames with `_` (`_deploy.yml`, `_build.yml`) to distinguish them from top-level workflows. Alternatively, place them in a subdirectory:

```
.github/
├── workflows/
│   ├── ci.yml
│   ├── deploy.yml
│   └── _shared/
│       ├── _build.yml
│       └── _test.yml
```

---

## Triggers: be specific

### Bad — runs on every push to every branch

```yaml
on: push
```

### Better — restricted to the main branch and meaningful paths

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'package.json'
      - '.github/workflows/ci.yml'
```

Path filtering saves runner minutes. A docs-only change doesn't need to run the full test suite.

### For PR workflows, use the right types

```yaml
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]    # default — don't need to list
```

You almost never need `types: [closed]` unless you're doing cleanup (closing preview environments). Adding `labeled` without `synchronize` means new commits don't re-trigger CI.

---

## Monorepo organization

For monorepos with multiple projects, use job-level defaults and path filters:

```yaml
# ci.yml
on:
  push:
    paths:
      - 'frontend/**'
      - 'backend/**'
      - '.github/workflows/ci.yml'

jobs:
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps: [...]

  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    steps: [...]
```

For very large monorepos, prefer separate workflow files per project with path filtering:

```
.github/workflows/
├── frontend-ci.yml       # triggers only on frontend/** changes
├── backend-ci.yml        # triggers only on backend/** changes
└── deploy.yml            # triggers on main, deploys both
```

---

## Directory structure summary

### Simple repo

```
.github/
├── workflows/
│   ├── ci.yml
│   ├── deploy.yml
│   └── nightly.yml
└── actions/
    └── setup/action.yml
```

### Moderate repo with shared logic

```
.github/
├── workflows/
│   ├── ci.yml
│   ├── deploy-staging.yml
│   ├── deploy-production.yml
│   └── _shared/
│       └── _deploy.yml
└── actions/
    ├── setup-node/action.yml
    └── notify/action.yml
```

### Monorepo

```
.github/
├── workflows/
│   ├── frontend-ci.yml        # paths: frontend/**
│   ├── backend-ci.yml         # paths: backend/**
│   ├── e2e.yml                # paths: e2e/**
│   ├── deploy-production.yml  # on: release → all three
│   └── dependabot-auto-merge.yml
```

---

## Documentation in workflows

Use `name:` on every job and step for readable logs:

```yaml
jobs:
  build:
    name: Build the application
    steps:
      - name: Check out code
        uses: actions/checkout@v4
      - name: Run tests
        run: npm test
```

In the Actions tab, this reads as a story: "Build the application → Check out code → Run tests" rather than "build → Run actions/checkout@v4 → Run npm test".

---

## Version control for workflows

- **Every workflow change is a PR** — treat workflow code like production code
- **Review workflows for secrets leakage** — a `run: env` in a PR from a fork shouldn't dump secrets
- **Use `.github` CODEOWNERS** to require review on workflow changes:

```
# .github/CODEOWNERS
.github/workflows/   @org/devops-team
```

[← Back to index](../index.md)
