# Conditionals (`if`)

The `if` key controls whether a job or step runs. It's evaluated on the runner just before execution. If the condition is `false`, the job/step is skipped.

---

## Basic syntax

```yaml
jobs:
  deploy:
    if: github.ref == 'refs/heads/main'       # only on main
    runs-on: ubuntu-latest
    steps: [...]

steps:
  - run: npm run build
    if: ${{ !cancelled() }}                    # skip if manually cancelled
```

---

## Status check functions

These are available **only** in `if` conditions and describe the state of the workflow so far:

### `success()`

Returns `true` when **none of the previous steps have failed**. This is the default — if you don't write `if`, it behaves as `if: success()`.

```yaml
steps:
  - run: npm test
  - run: echo "Tests passed!"                     # runs only if 'npm test' passed
```

Equivalent to:

```yaml
steps:
  - run: npm test
  - run: echo "Tests passed!"
    if: success()
```

### `always()`

Returns `true` **regardless** of whether previous steps failed or the run was cancelled. Use this for cleanup, artifact upload, and notifications that must fire no matter what.

```yaml
steps:
  - run: npm test
  - uses: actions/upload-artifact@v4              # uploads results even if tests failed
    if: always()
    with:
      name: test-results
      path: junit.xml
```

Note: `always()` is `true` even when the run is **cancelled**. If you need to skip cleanup on cancellation, combine with `!cancelled()`:

```yaml
if: ${{ always() && !cancelled() }}
```

### `failure()`

Returns `true` only when a previous step **failed** (non-zero exit). Skipped steps don't count as failure.

```yaml
steps:
  - run: npm test
  - name: Notify on failure
    if: failure()
    run: curl -X POST https://hooks.slack.com/... -d '{"text":"Tests failed!"}'
```

### `cancelled()`

Returns `true` when the workflow run was **manually cancelled** (via the UI or API).

```yaml
steps:
  - run: echo "Cleaning up..."
    if: cancelled()
```

---

## Status function truth table

| Previous steps | `success()` | `failure()` | `cancelled()` | `always()` |
|---------------|-------------|-------------|---------------|------------|
| All passed | `true` | `false` | `false` | `true` |
| One failed | `false` | `true` | `false` | `true` |
| Cancelled | `false` | `false` | `true` | `true` |
| Skipped | `false` | `false` | `false` | `true` |

---

## Context comparisons

### Branch comparisons

```yaml
if: github.ref == 'refs/heads/main'
if: github.ref_name == 'main'                     # shorter alternative
if: startsWith(github.ref, 'refs/tags/v')
```

### Event comparisons

```yaml
if: github.event_name == 'push'
if: github.event_name == 'pull_request'
if: github.event_name == 'schedule'
if: github.event_name == 'workflow_dispatch'
```

### Event payload comparisons

```yaml
if: github.event.pull_request.merged == true             # PR was merged
if: github.event.pull_request.draft == false             # not a draft PR
if: contains(github.event.pull_request.labels.*.name, 'deploy')
```

### Repository comparisons

```yaml
if: github.repository == 'owner/main-repo'
if: github.repository_owner == 'my-org'
```

---

## Combining conditions

```yaml
# AND
if: github.ref == 'refs/heads/main' && github.event_name == 'push'

# OR
if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging'

# Grouping
if: (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging') && github.event_name == 'push'

# Negation
if: ${{ !startsWith(github.ref, 'refs/tags/') }}
if: github.ref != 'refs/heads/main'
```

---

## Common patterns

### Deploy only on main

```yaml
jobs:
  deploy:
    if: github.ref == 'refs/heads/main'
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps: [...]
```

### Skip a job for certain paths (don't build docs on src/ changes)

```yaml
jobs:
  docs:
    if: ${{ !contains(github.event.commits.*.modified, 'src/') }}
    runs-on: ubuntu-latest
    steps: [...]
```

### Only run on non-fork PRs

```yaml
if: github.event.pull_request.head.repo.full_name == github.repository
```

### Require a specific label to run

```yaml
if: contains(github.event.pull_request.labels.*.name, 'safe-to-test')
```

### Run different steps per OS in a matrix

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - run: npm test
      - run: ./scripts/linux-only.sh
        if: runner.os == 'Linux'
      - run: .\scripts\windows-only.ps1
        if: runner.os == 'Windows'
```

### Gate on a previous step's output

```yaml
steps:
  - id: check
    run: echo "changed=true" >> $GITHUB_OUTPUT

  - run: echo "Files changed — running full suite"
    if: steps.check.outputs.changed == 'true'
```

---

## `if` at the job level vs step level

A job-level `if` that evaluates to `false` means:
- The job is skipped entirely
- No runner is provisioned (zero cost)
- Jobs that `needs` this job see it as skipped and **also skip by default**

To let downstream jobs run even when an upstream job is skipped, use:

```yaml
jobs:
  deploy:
    needs: build
    if: ${{ always() && needs.build.result == 'success' }}
```

Step-level `if` that evaluates to `false`:
- The step is skipped
- Subsequent steps still run (unlike step failures)

---

## `!` (negation) and `${{ }}` requirement

When using `!` at the start of an `if` condition, you MUST use `${{ }}`:

```yaml
# Correct
if: ${{ !startsWith(github.ref, 'refs/tags/') }}

# WRONG — YAML parser swallows the !
if: !startsWith(github.ref, 'refs/tags/')
```

When `!` appears in the middle, `${{ }}` is optional:

```yaml
if: github.ref != 'refs/heads/main'               # works fine
```

---

## Secret and variable comparisons

```yaml
if: github.ref == vars.PROTECTED_BRANCH            # vars context (not masked)
if: github.event.inputs.environment == 'production' # dispatch inputs
```

Secrets **cannot** be used in `if` conditions for PRs from public forks — they evaluate as empty strings. This prevents fork PRs from exfiltrating secrets by crafting conditions.

[← Back to index](../index.md)
