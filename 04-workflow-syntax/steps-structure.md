# steps structure

Steps are the individual commands and actions that make up a job. Steps run **sequentially** in the order they are defined. If a step fails (non-zero exit code), the job fails and subsequent steps are skipped — unless you use `continue-on-error` or `if`.

---

## Step anatomy

```yaml
steps:
  - name: Install dependencies        # display name (optional but recommended)
    id: install                        # unique id (needed to reference outputs later)
    if: ${{ !cancelled() }}             # condition for running the step
    uses: actions/setup-node@v4        # run a pre-built action
    with:                              # inputs to the action
      node-version: 20
    env:                               # environment variables for this step only
      NODE_ENV: ci
    continue-on-error: false           # if true, failure doesn't fail the job
    timeout-minutes: 5                 # max duration for this step
```

A step must contain exactly **one** of `uses` or `run`:

| Key | Purpose |
|-----|---------|
| `uses` | Run a GitHub Action (e.g., `actions/checkout@v4`) |
| `run` | Execute a shell command (e.g., `npm test`) |

---

## `uses` — running an action

```yaml
steps:
  - uses: actions/checkout@v4               # official action
  - uses: docker/setup-buildx-action@v3     # Docker's action
  - uses: ./github/actions/my-action        # local composite action
```

Always pin to a version (`@v4`) or commit SHA (`@a81bbbf`). Never use `@main` or `@master` — they can change without warning and break your CI.

### Passing inputs

```yaml
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: 20
      cache: 'npm'
```

Inputs are action-specific. Check each action's README for available inputs.

### Passing secrets to actions

```yaml
steps:
  - uses: some/action@v1
    with:
      api-key: ${{ secrets.MY_API_KEY }}    # never hardcode
```

---

## `run` — executing shell commands

```yaml
steps:
  - run: npm ci
  - run: npm test
  - run: npm run build
```

### Multi-line commands

Use `|` to run multiple commands in the **same step** (same shell session):

```yaml
steps:
  - name: Build and test
    run: |
      npm ci
      npm run build
      npm test
```

Using `|` preserves newlines. Each line is a separate command but they share the same shell environment (variables, working directory).

### Using `>` for folded lines

```yaml
steps:
  - run: >
      echo "This will all be folded"
      echo "into a single line"
```

Rarely used — `|` is almost always what you want.

---

## `shell` — changing the shell

```yaml
steps:
  - run: echo "Hello"
    shell: bash                          # default on Linux/macOS

  - run: echo "Hello"
    shell: pwsh                          # PowerShell Core (cross-platform)

  - run: echo "Hello"
    shell: python {0}                    # run the command as a Python script
```

| Shell | Platform | Notes |
|-------|----------|-------|
| `bash` | Linux, macOS | Default on non-Windows runners |
| `pwsh` | All | PowerShell Core |
| `powershell` | Windows | Windows PowerShell (Desktop) |
| `cmd` | Windows | Command Prompt |
| `python {0}` | All | Executes the command as Python code |
| `node {0}` | All | Executes the command as Node.js code |

Custom shells require the executable to be on the `PATH`.

---

## `working-directory` — running in a subdirectory

```yaml
steps:
  - run: npm ci
    working-directory: ./frontend

  - run: npm test
    working-directory: ./frontend
```

Useful for monorepos where each package has its own `package.json`.

---

## `env` — step-level environment variables

```yaml
steps:
  - run: echo $MY_VAR
    env:
      MY_VAR: hello                    # only available in this step
```

Step-level `env` overrides job-level and workflow-level `env`.

---

## `id` — naming a step for output references

```yaml
steps:
  - id: build-version
    run: echo "version=1.2.3" >> $GITHUB_OUTPUT

  - run: echo "Building version ${{ steps.build-version.outputs.version }}"
```

Without `id`, you can't reference the step's outputs. `id` must be unique within the job.

---

## `if` — conditional steps

```yaml
steps:
  - run: npm run deploy
    if: github.ref == 'refs/heads/main'          # only on main

  - uses: actions/upload-artifact@v4
    if: always()                                  # always runs, even on failure
    with:
      name: logs
      path: logs/

  - run: echo "Deploy skipped"
    if: ${{ !success() }}                       # only on failure
```

Without `if`, a step runs unless a previous step failed.

---

## `continue-on-error` — don't fail the job

```yaml
steps:
  - run: ./flaky-integration-test.sh
    continue-on-error: true              # failure → amber warning, not red X
```

The step shows as **warning** if it fails, and the job continues to the next step. Useful for optional checks.

---

## `timeout-minutes` — step timeout

```yaml
steps:
  - run: ./long-running-task.sh
    timeout-minutes: 10                  # kill after 10 minutes
```

Default: **360 minutes** (inherits from job). If both the step and job have `timeout-minutes`, the step's value must be less than or equal to the job's.

---

## Step execution order

Steps run top-to-bottom. If a step fails:

1. The step status is set to `failure`
2. Subsequent steps are **skipped** UNLESS they have `if: always()` or `if: failure()`
3. The job status becomes `failure`

```
Step 1 ✓ → Step 2 ✓ → Step 3 ✕ (fails) → Step 4 (skipped) → Step 5 with if: always() ✓
```

---

## Complete step reference

```yaml
steps:
  - name: Check out code
    uses: actions/checkout@v4

  - name: Set up Node
    uses: actions/setup-node@v4
    with:
      node-version: 20
      cache: npm

  - name: Install
    run: npm ci

  - name: Test
    id: test-run
    run: npm test
    env:
      CI: true
    timeout-minutes: 5

  - name: Upload coverage
    uses: actions/upload-artifact@v4
    if: always()
    with:
      name: coverage
      path: coverage/
```

See working step chains in the example workflows:
- [Node.js CI](../examples/nodejs-app/.github/workflows/ci.yml)
- [Python CI](../examples/python-app/.github/workflows/ci.yml)
- [Java CI](../examples/java-app/.github/workflows/ci.yml)

[← Back to index](../index.md)
