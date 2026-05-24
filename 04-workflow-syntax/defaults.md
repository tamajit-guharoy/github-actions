# defaults

The `defaults` key sets default values for `shell` and `working-directory` across an entire workflow or a specific job. It reduces repetition when every step uses the same shell or works in the same subdirectory.

---

## Setting workflow-wide defaults

```yaml
defaults:
  run:
    shell: bash                                    # default shell for all run: steps
    working-directory: ./src                        # default directory for all run: steps
```

These apply to **every `run:` step** in every job. They do NOT apply to `uses:` steps — actions run in their own context.

---

## Setting job-level defaults

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend              # only applies to this job
        shell: pwsh
    steps:
      - run: npm ci                                # runs in ./frontend with pwsh
      - run: npm test                               # runs in ./frontend with pwsh
```

Job-level defaults **override** workflow-level defaults.

---

## `shell` — default shell

By default, the shell is `bash` on Linux/macOS and `pwsh` on Windows. Use defaults to change it:

```yaml
defaults:
  run:
    shell: pwsh                                    # use PowerShell Core everywhere
```

Available shells:

| Value | Shell |
|-------|-------|
| `bash` | bash (Linux/macOS default) |
| `pwsh` | PowerShell Core |
| `powershell` | Windows PowerShell |
| `cmd` | Windows Command Prompt |
| `python {0}` | Python |
| `node {0}` | Node.js |

A step-level `shell:` overrides the default.

---

## `working-directory` — default working directory

```yaml
defaults:
  run:
    working-directory: ./backend
```

All `run:` steps now execute relative to `./backend`:

```yaml
steps:
  - run: pwd                  # /home/runner/work/repo/repo/backend
  - run: npm ci               # installs from ./backend/package.json
  - run: npm test             # runs tests in ./backend
```

### Monorepo example

```yaml
name: Monorepo CI

on: push

jobs:
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run build

  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r requirements.txt
      - run: pytest
```

Without `defaults`, every `run:` would need `working-directory: ./frontend` or `working-directory: ./backend`.

---

## `defaults` vs step-level overrides

A step-level `shell` or `working-directory` always takes precedence:

```yaml
defaults:
  run:
    working-directory: ./frontend
    shell: bash

steps:
  - run: npm ci                                       # uses ./frontend + bash
  - run: npm test                                     # uses ./frontend + bash
  - run: echo "Hello from root"                       # uses ./ (root) as set below
    working-directory: ./
  - run: Get-Location                                 # uses pwsh
    shell: pwsh
```

---

## What defaults does NOT affect

- **`uses:` steps** — actions run in their own directory and bring their own shell
- **`with:` inputs** — input values aren't shell commands
- **`env:` values** — environment variables are not paths or shells
- **`if:` conditions** — expressions are not shell-evaluated

---

## Common patterns

### All-in on PowerShell (Windows-focused team)

```yaml
defaults:
  run:
    shell: pwsh
```

### Monorepo with shared checkout

```yaml
jobs:
  test-service-a:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: services/a
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
```

### Python project in a subdirectory

```yaml
defaults:
  run:
    working-directory: ./api
```

---

## When NOT to use defaults

Don't use workflow-wide `working-directory` if some jobs need the repo root. Prefer job-level defaults or individual step `working-directory` in that case.

Don't set `shell: cmd` workflow-wide on a cross-platform matrix — it will fail on Linux/macOS.

[← Back to index](../index.md)
