# Steps

A **step** is an individual task within a job. Steps run sequentially on the same runner and can share data through the filesystem.

## Two types of steps

### 1. Run a shell command

```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v4

  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: 20
      cache: 'npm'

  - name: Install dependencies
    run: npm ci

  - name: Run tests
    run: npm test
    env:
      NODE_ENV: test
```

### 2. Use an action

```yaml
steps:
  - uses: actions/checkout@v4       # official action
  - uses: akhileshns/heroku-deploy@v3  # community action
```

Actions are reusable units — either from a public repo, a local path, or a Docker image.

## Step-specific settings

| Setting | Purpose |
|---------|---------|
| `name` | Display name shown in the GitHub UI |
| `id` | Identifier for referencing outputs later |
| `if` | Condition to skip the step |
| `env` | Environment variables scoped to this step only |
| `working-directory` | Change directory before running |
| `continue-on-error` | Don't fail the job if this step fails |
| `timeout-minutes` | Max runtime for this step |

## Working directory and shell

```yaml
steps:
  - run: npm ci
    working-directory: ./frontend

  - run: |
      echo "Multiline script"
      python --version
    shell: bash
```

Default shell is `bash` on Linux/macOS runners and `pwsh` on Windows. You can override with `shell: python`, `shell: node`, etc.

## Step isolation

Steps within a job share the runner's filesystem. A file written by step 1 is available to step 2:

```yaml
steps:
  - run: echo "hello" > greeting.txt
  - run: cat greeting.txt          # reads the file just written
```

---

[← Back to index](../index.md)
