# Workflow Syntax Overview

Every GitHub Actions workflow is a YAML file with a predictable structure. Understanding that structure makes reading and writing any workflow straightforward.

## Anatomy of a workflow

```
┌─────────────────────────────────────────────┐
│  name: "My Workflow"       ← Display name   │
│  on:                        ← When to run   │
│    push:                                    │
│      branches: [main]                       │
│                                             │
│  jobs:                      ← What to run   │
│    build:                   ← Job id        │
│      runs-on: ubuntu-latest ← Runner type   │
│      steps:                 ← Ordered list  │
│        - uses: actions/checkout@v4  (action)│
│        - run: npm test              (shell) │
└─────────────────────────────────────────────┘
```

## The four top-level keys

| Key | Required | Purpose |
|-----|----------|---------|
| `name` | No | Display name in the Actions tab. Defaults to the filename if omitted. |
| `on` | Yes* | The event(s) that trigger the workflow. |
| `jobs` | Yes | One or more jobs to execute. Each job runs on its own runner. |
| `permissions` | No | Limits what the workflow's `GITHUB_TOKEN` can do. Defaults to read/write. |

\* `on` can be omitted if the workflow is only triggered by `workflow_call` (reusable workflows).

## The `on` block — triggers

```yaml
on:
  push:                            # Every git push
  pull_request:                    # PRs opened, updated, or re-opened
  workflow_dispatch:               # Manual trigger from the Actions tab
    inputs:
      environment:
        description: 'Deploy to'
        required: true
        type: choice
        options: [staging, production]
  schedule:
    - cron: '0 3 * * 1'            # Every Monday at 3 AM UTC
```

Filter by branch, tag, or path:

```yaml
on:
  push:
    branches: [main]               # only main
    tags: ['v*']                   # only version tags
    paths:                         # only when these change
      - 'src/**'
      - 'package.json'
```

## The `jobs` block — work units

Each job gets a unique `job_id` (like `build`, `test`, `deploy`). Jobs run **in parallel by default** unless you add `needs`:

```yaml
jobs:
  lint:                            # job_id: "lint"
    runs-on: ubuntu-latest
    steps: [...]

  test:                            # job_id: "test"
    needs: lint                    # wait for lint to finish first
    runs-on: ubuntu-latest
    steps: [...]
```

## The `steps` block — what runs inside a job

Steps execute sequentially. Each step is either:

- **An action**: `uses: owner/repo@version`
- **A shell command**: `run: command here`

```yaml
steps:
  - name: Check out code           # name is optional but recommended
    uses: actions/checkout@v4

  - name: Install dependencies
    run: npm ci

  - name: Run tests
    run: npm test
```

## The `runs-on` key — where it runs

```yaml
runs-on: ubuntu-latest             # Linux (default for most workflows)
runs-on: windows-latest            # Windows Server
runs-on: macos-latest              # macOS
runs-on: self-hosted               # Your own machine
```

## YAML rules that trip people up

1. **Indentation matters.** Use 2 spaces (not tabs). Nested keys are indented.

2. **Lists use `-`.** Each item in a sequence starts with a dash and a space.

3. **Strings usually don't need quotes.** But quote strings that contain `:`, `{`, `}`, `[`, `]`, `&`, `*`, `?`, `|`, `-`, `<`, `>`, `=`, `!`, `%`, `@`, `` ` `` or start with `{`:

   ```yaml
   name: "deploy:production"       # colon needs quoting
   run: echo "Hello"               # fine — the colon is inside a string value
   ```

4. **Multi-line strings** use `|` (preserves newlines) or `>` (folds to spaces):

   ```yaml
   run: |
     echo "line one"
     echo "line two"
   ```

5. **Expressions use `${{ }}`:**

   ```yaml
   node-version: ${{ matrix.node-version }}
   ```

## Full annotated example

See the [hello-world example workflow](../examples/hello-world/.github/workflows/hello.yml) for a minimal working workflow with detailed inline comments.

[← Back to index](../index.md)
