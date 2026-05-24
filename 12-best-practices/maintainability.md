# Maintainability

Workflows are code. Like any codebase, they rot without attention. These practices keep your workflows readable, debuggable, and easy to change — months after you wrote them.

---

## Use `name:` on everything

Every job and every step should have a descriptive `name:`:

```yaml
# Bad — logs show "Run actions/checkout@v4"
steps:
  - uses: actions/checkout@v4
  - run: npm ci
  - run: npm test

# Good — logs tell a story
steps:
  - name: Check out code
    uses: actions/checkout@v4
  - name: Install dependencies
    run: npm ci
  - name: Run unit tests
    run: npm test
```

This is the single highest-leverage maintainability practice. When a step fails in the Actions tab, `Run unit tests` tells you what broke; `Run npm test` requires reading the YAML.

---

## Keep workflows short

A workflow file over 200 lines is hard to scan. Signs it's too long:
- You scroll to find the job you need
- The same step sequence appears 3+ times
- You need comments to explain the structure

### Extract repeated steps to a composite action

```yaml
# Before: 40 lines repeated in 3 workflows
- uses: actions/setup-node@v4
  with: { node-version: '20', cache: 'npm' }
- run: npm ci
- run: npm run build

# After: 1 line
- uses: ./.github/actions/setup-and-build
```

### Extract repeated jobs to a reusable workflow

```yaml
# Before: 30 lines repeated in 5 repos
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps: [...30 lines...]

# After: shared in my-org/shared-workflows
jobs:
  deploy:
    uses: my-org/shared-workflows/.github/workflows/deploy.yml@v1
    with:
      environment: production
    secrets: inherit
```

---

## Pin versions, but don't let them go stale

```yaml
# Pin to major version
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
- uses: docker/setup-buildx-action@v3
```

Major version tags receive patch and minor updates automatically. This balances stability (no breaking changes) with maintenance (security patches arrive without your intervention).

### Use Dependabot to track action updates

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "ci"
      - "dependencies"
```

Dependabot opens PRs when action versions bump. You review and merge at your pace.

---

## Avoid inline scripts

Scripts over 3 lines should be extracted to a file:

```yaml
# Bad — 20-line inline script
- run: |
    #!/bin/bash
    set -euo pipefail
    FILES=$(git diff --name-only HEAD~1)
    for f in $FILES; do
      if [[ $f == *.js ]]; then
        echo "Linting $f"
        npx eslint "$f"
      fi
    done

# Good — call a script
- run: .github/scripts/lint-changed-files.sh
```

Separate script files are:
- **Testable**: you can run them locally
- **Lintable**: shellcheck catches bugs
- **Reusable**: across workflows and repos
- **Reviewable**: diffs are cleaner in PRs

---

## Consistent formatting

### One blank line between top-level blocks

```yaml
name: CI

on:
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run lint

  test:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
```

### Indent lists with 2 spaces

```yaml
steps:
  - uses: actions/checkout@v4       # 2-space indent
  - run: npm test                    # dash + 1 space

with:
  node-version: 20                   # 2-space indent under with:
```

### Use `|-` or `>-` for multi-line strings (not bare `|`)

```yaml
- run: |
    echo "line 1"
    echo "line 2"
```

### Quote strings that need it

```yaml
# Strings with special YAML characters
name: "Deploy to production: v2"
if: "contains(github.ref, 'main')"
```

---

## Environment-specific configuration

Don't hardcode environment values. Use `vars` and `secrets`:

```yaml
# Bad
jobs:
  deploy-staging:
    steps:
      - run: deploy.sh --url https://staging.example.com

  deploy-production:
    steps:
      - run: deploy.sh --url https://example.com

# Good
jobs:
  deploy:
    strategy:
      matrix:
        environment: [staging, production]
    environment: ${{ matrix.environment }}
    steps:
      - run: deploy.sh --url ${{ vars.DEPLOY_URL }}
```

The `vars.DEPLOY_URL` resolves to the correct value per environment. Adding a third environment doesn't require a new workflow file.

---

## Comments: what and why, not how

```yaml
# Good — explains why this is necessary
# Must upload even on failure so we can debug flaky tests
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: test-results
    path: junit.xml

# Bad — restates the YAML
# Upload test results
- uses: actions/upload-artifact@v4
  if: always()
  ...
```

YAML is already readable. Comments should explain constraints, workarounds, and decisions — things not obvious from the code.

---

## Test workflows like code

### Use act for local iteration

```bash
act push                   # test locally before pushing
```

### Use `workflow_dispatch` for manual testing

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:        # always add this
```

You can trigger the workflow from the Actions tab without pushing a new commit.

### Validate YAML before committing

```bash
# Using Python
python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"

# Using yamllint
yamllint .github/workflows/ci.yml

# Using actionlint (catches GitHub Actions-specific issues)
actionlint .github/workflows/ci.yml
```

### Pre-commit hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/rhysd/actionlint
    rev: v1.7.0
    hooks:
      - id: actionlint
```

This catches errors before they reach GitHub.

---

## When to consolidate vs split

| Consolidate when... | Split when... |
|---------------------|---------------|
| Same trigger, same branch filter | Different triggers |
| Sequential steps (lint → test → build) | Jobs can run independently |
| Max 3–4 jobs | Different environments (staging has different protection rules) |
| Single concern (CI, deploy) | Different concerns (CI vs cleanup) |

---

## Maintainability checklist

- [ ] Every job has a `name:`
- [ ] Every step has a `name:`
- [ ] Workflows are under 200 lines (or use extracted composite actions)
- [ ] Inline scripts ≤ 3 lines (longer ones extracted to files)
- [ ] Action versions pinned to major tags (`@v4`)
- [ ] Dependabot configured for action updates
- [ ] `workflow_dispatch` available for manual testing
- [ ] Environment-specific values use `vars`, not hardcoded strings
- [ ] Comments explain why, not what
- [ ] Pre-commit linting catches YAML errors locally

[← Back to index](../index.md)
