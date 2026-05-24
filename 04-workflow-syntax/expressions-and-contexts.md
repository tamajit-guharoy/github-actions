# Expressions & Contexts

Expressions are the templating language of GitHub Actions. They let you access dynamic data, compare values, and transform strings — all evaluated at runtime on the runner.

---

## Expression syntax

Expressions are wrapped in `${{ }}`:

```yaml
${{ github.ref }}
${{ matrix.node-version }}
${{ steps.build.outputs.artifact }}
${{ secrets.MY_TOKEN }}
```

Expressions can appear almost anywhere in a workflow — in `if` conditions, `with` inputs, `env` values, and `run` commands.

---

## Literals and operators

### Data types

```yaml
${{ true }}                     # boolean
${{ 42 }}                       # number
${{ 'hello' }}                  # string (single quotes)
${{ "hello" }}                  # string (double quotes)
${{ null }}                     # null
```

### Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `( )` | Grouping | `${{ (1 + 2) * 3 }}` |
| `[ ]` | Index | `${{ matrix.version[0] }}` |
| `.` | Property access | `${{ github.ref }}` |
| `!` | Not | `${{ !success() }}` |
| `<`, `<=` | Less than | `${{ steps.test.outputs.coverage < 80 }}` |
| `>`, `>=` | Greater than | `${{ steps.test.outputs.coverage >= 80 }}` |
| `==`, `!=` | Equality | `${{ github.ref == 'refs/heads/main' }}` |
| `&&` | And | `${{ success() && github.ref == 'refs/heads/main' }}` |
| `\|\|` | Or | `${{ github.ref == 'refs/heads/main' \|\| github.ref == 'refs/heads/staging' }}` |

### Type coercion

In `if` conditions, these values are **falsy**:

```yaml
false, 0, -0, "", '', null, undefined, NaN, {}  # empty object is truthy (JavaScript semantics)
```

---

## Contexts — where data comes from

Contexts are objects containing information about the workflow run, job, runner, and events. Access them with `${{ context.property }}`.

### `github` context

Information about the workflow run and the event that triggered it:

```yaml
${{ github.actor }}              # username of the person who triggered the run
${{ github.event_name }}         # 'push', 'pull_request', 'workflow_dispatch', etc.
${{ github.ref }}                # 'refs/heads/main' or 'refs/tags/v1.0'
${{ github.ref_name }}           # just 'main' or 'v1.0' (without refs/ prefix)
${{ github.ref_type }}           # 'branch' or 'tag'
${{ github.sha }}                # full commit SHA (40 characters)
${{ github.workflow }}           # workflow name
${{ github.run_id }}             # unique ID for this workflow run
${{ github.run_number }}         # incrementing number (1, 2, 3...)
${{ github.run_attempt }}        # 1 for first run, 2+ for re-runs
${{ github.repository }}         # 'owner/repo'
${{ github.repository_owner }}   # just 'owner'
${{ github.server_url }}         # 'https://github.com'
${{ github.api_url }}            # 'https://api.github.com'
```

### `github.event` — the full webhook payload

```yaml
${{ github.event.pusher.name }}
${{ github.event.pull_request.number }}
${{ github.event.pull_request.head.ref }}
${{ github.event.release.tag_name }}
${{ github.event.issue.title }}
```

Use `toJSON()` to inspect the payload:

```yaml
steps:
  - run: echo '${{ toJSON(github.event) }}'
```

### `env` context

Workflow and job environment variables:

```yaml
${{ env.MY_VAR }}
${{ env.NODE_ENV }}
```

Note: step-level `env` is NOT available in the `env` context until the step runs. Use job-level `env` for cross-step access.

### `vars` context

Configuration variables (repo, org, or environment-level):

```yaml
${{ vars.STAGING_URL }}
${{ vars.DEFAULT_REGION }}
```

Set these at: **Settings → Secrets and variables → Actions → Variables**.

Unlike secrets, variables are NOT masked in logs.

### `secrets` context

```yaml
${{ secrets.DOCKERHUB_TOKEN }}
${{ secrets.AWS_ACCESS_KEY_ID }}
```

Secrets are **automatically masked** in logs. If a secret's value appears in output, GitHub replaces it with `***`.

### `matrix` context

```yaml
${{ matrix.os }}
${{ matrix.node-version }}
${{ matrix.python-version }}
```

Only available in jobs with a `strategy.matrix`.

### `runner` context

```yaml
${{ runner.os }}                 # 'Linux', 'Windows', or 'macOS'
${{ runner.arch }}               # 'X64', 'ARM64'
${{ runner.name }}               # hostname of the runner
${{ runner.temp }}               # path to temp directory: /home/runner/work/_temp
${{ runner.tool_cache }}         # path to tool cache: /opt/hostedtoolcache
```

### `job` context

```yaml
${{ job.status }}                # 'success', 'failure', 'cancelled', 'skipped'
${{ job.container.id }}          # Docker container ID (when using container:)
${{ job.services.postgres.id }}  # service container ID
${{ job.services.postgres.ports['5432'] }}
```

### `steps` context

Access outputs from previous steps within the same job:

```yaml
steps:
  - id: build-version
    run: echo "version=1.2.3" >> $GITHUB_OUTPUT

  - run: echo "${{ steps.build-version.outputs.version }}"     # 1.2.3
```

Only available for steps that have already run. You cannot reference a future step or the current step.

### `inputs` context

```yaml
${{ inputs.environment }}
${{ inputs.dry-run }}
```

Available in:
- `workflow_dispatch` — manual trigger inputs
- `workflow_call` — parameters from calling workflow

### `needs` context

Outputs from jobs that finished (via `needs`):

```yaml
jobs:
  deploy:
    needs: build
    steps:
      - run: echo "${{ needs.build.outputs.artifact-name }}"
      - run: echo "${{ needs.build.result }}"                 # 'success', 'failure', etc.
```

When the upstream job is a matrix, use JSON:

```yaml
${{ toJSON(needs.test.outputs) }}
```

---

## Built-in functions

### `contains(search, item)`

```yaml
if: contains(github.event.pull_request.labels.*.name, 'bug')
if: ${{ contains('hello world', 'world') }}         # true
```

### `startsWith(searchString, searchValue)`

```yaml
if: startsWith(github.ref, 'refs/tags/v')
if: ${{ startsWith('hello world', 'hello') }}       # true
```

### `endsWith(searchString, searchValue)`

```yaml
if: endsWith(github.ref_name, '-rc')
```

### `format(string, ...args)`

```yaml
${{ format('v{0}.{1}.{2}', major, minor, patch) }}
${{ format('{0}/{1}@{2}', steps.meta.outputs.registry, steps.meta.outputs.image, matrix.tag) }}
```

### `join(array, separator)`

```yaml
${{ join(matrix.os, ', ') }}
${{ join(github.event.commits.*.message, ' | ') }}
```

### `toJSON(value)`

```yaml
${{ toJSON(github.event) }}
${{ toJSON(needs) }}
```

Invaluable for debugging — use it in a `run: echo` step to inspect any context.

### `fromJSON(string)`

```yaml
${{ fromJSON(needs.build.outputs.matrix) }}
```

Parses a JSON string back into an object for property access.

### `hashFiles(paths...)`

```yaml
${{ hashFiles('package-lock.json') }}
${{ hashFiles('**/package-lock.json') }}
```

Returns a SHA-256 hash. Most commonly used for cache keys:

```yaml
- uses: actions/cache@v4
  with:
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
```

---

## Status check functions

Available **only** in `if` conditions (not in `run` commands):

| Function | Returns true when |
|----------|-------------------|
| `success()` | No previous step or job has failed |
| `always()` | Always — even if cancelled or failed |
| `cancelled()` | The workflow run was cancelled |
| `failure()` | Any previous step or job failed |

```yaml
steps:
  - run: echo "This always runs"
    if: always()

  - run: echo "Cleanup after failure"
    if: failure()
```

See [Conditionals](conditionals.md) for detailed usage.

---

## Writing outputs from steps

### `$GITHUB_OUTPUT` — key-value outputs

```yaml
steps:
  - id: build
    run: |
      echo "version=1.2.3" >> $GITHUB_OUTPUT
      echo "artifact=my-app" >> $GITHUB_OUTPUT
```

Available downstream as `${{ steps.build.outputs.version }}`.

### `$GITHUB_ENV` — environment variables for later steps

```yaml
steps:
  - run: echo "BUILD_DATE=$(date +%Y-%m-%d)" >> $GITHUB_ENV
  - run: echo $BUILD_DATE             # now available
```

### `$GITHUB_STEP_SUMMARY` — job summary text

```yaml
steps:
  - run: |
      echo "## Test Results" >> $GITHUB_STEP_SUMMARY
      echo "✅ All tests passed" >> $GITHUB_STEP_SUMMARY
      echo "Coverage: 95%" >> $GITHUB_STEP_SUMMARY
```

Appears on the run summary page.

---

## Expression gotchas

1. **`if` conditions don't need `${{ }}` wrapper** — but they work either way:

   ```yaml
   if: github.ref == 'refs/heads/main'            # preferred
   if: ${{ github.ref == 'refs/heads/main' }}     # also valid
   ```

   When you use `${{ }}` in `if`, the expression is evaluated and then the result is treated as the condition. Without it, GitHub auto-wraps the condition. Prefer without — it's less surprising.

2. **Using `!` in `if` requires `${{ }}`**:

   ```yaml
   if: ${{ !startsWith(github.ref, 'refs/tags/') }}
   ```

3. **Null vs empty string**: `${{ null }}` is truthy in most positions but `null` objects can cause surprising errors. Always guard with `if:` or a check:

   ```yaml
   if: steps.build.outputs.version != ''
   ```

4. **Secrets can't be used in `if` conditions on PRs from forks** — they evaluate as empty strings.

[← Back to index](../index.md)
