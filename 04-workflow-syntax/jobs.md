# jobs.<job_id>

Jobs are the workhorses of a workflow. Each job runs on its own fresh virtual machine and contains an ordered list of steps.

---

## Job definition

```yaml
jobs:
  build:                          # ← job_id: unique within the workflow
    name: "Build the application" # ← optional display name (defaults to job_id)
    runs-on: ubuntu-latest
    steps: [...]
```

A workflow can have up to **256 jobs** per run. Jobs run **in parallel by default**.

---

## `needs` — job ordering and dependencies

Without `needs`, all jobs start simultaneously. Add `needs` to create a dependency chain:

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [...]

  test:
    needs: lint                   # test starts AFTER lint succeeds
    runs-on: ubuntu-latest
    steps: [...]

  deploy:
    needs: [lint, test]           # deploy starts AFTER both lint AND test succeed
    runs-on: ubuntu-latest
    steps: [...]
```

```
lint ──┬── test ── deploy
       └────────────────  (deploy also waits for lint directly)
```

### Multiple dependencies

```yaml
needs: [lint, test, security-scan]   # wait for ALL three
```

### `needs` with matrix jobs

When a job depends on a matrix job, you can reference individual matrix results:

```yaml
test:
  strategy:
    matrix:
      version: [18, 20, 22]
  steps: [...]

merge-results:
  needs: test                       # waits for ALL matrix legs to complete
  steps: [...]
```

---

## `if` — conditional job execution

```yaml
jobs:
  deploy:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps: [...]
```

If the condition evaluates to `false`, the job is **skipped** entirely. Skipped jobs don't count against runner usage.

### Common conditions

```yaml
if: github.ref == 'refs/heads/main'
if: github.event_name == 'pull_request'
if: ${{ !cancelled() }}                          # run unless cancelled
if: ${{ always() && github.ref == 'refs/heads/main' }}
```

See the [Conditionals](conditionals.md) page for the full `if` reference.

---

## `outputs` — passing data between jobs

A job can export data for downstream jobs to consume:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      artifact-name: ${{ steps.create.outputs.name }}   # must reference a step output
      version: "1.2.3"
    steps:
      - id: create
        run: echo "name=my-app" >> $GITHUB_OUTPUT

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying ${{ needs.build.outputs.artifact-name }} v${{ needs.build.outputs.version }}"
```

Outputs must be strings. Use `toJSON()` to pass complex objects.

---

## `env` — job-level environment variables

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      NODE_ENV: production
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    steps:
      - run: echo $NODE_ENV         # production — available to all steps
      - run: echo $DATABASE_URL     # masked in logs (it's a secret)
```

Variables set at the job level override workflow-level `env`, and step-level `env` overrides both.

---

## `strategy` — running variants of a job

The `strategy` key creates a **matrix** of job variations:

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest]
    node: [18, 20]
  fail-fast: true                  # cancel all if one fails (default: true)
  max-parallel: 4                  # max concurrent jobs (default: unlimited by GitHub, limited by account plan)
```

This generates 2 × 2 = 4 parallel jobs:
- `(ubuntu-latest, 18)`, `(ubuntu-latest, 20)`, `(windows-latest, 18)`, `(windows-latest, 20)`

### Accessing matrix values

```yaml
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node }}
```

### Including/excluding combinations

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest]
    node: [18, 20, 22]
    exclude:
      - os: windows-latest
        node: 18                   # skip this combination
    include:
      - os: macos-latest
        node: 20                   # add an extra combination
```

---

## `timeout-minutes` — capping job duration

```yaml
jobs:
  build:
    timeout-minutes: 30            # kill the job after 30 minutes
    runs-on: ubuntu-latest
    steps: [...]
```

Default: **360 minutes** (6 hours). Maximum for GitHub-hosted runners: 360 minutes. Self-hosted: no limit.

---

## `continue-on-error` — keep going after failure

```yaml
jobs:
  experimental:
    runs-on: ubuntu-latest
    continue-on-error: true        # failure won't cancel the workflow run
    steps:
      - run: exit 1
```

Useful for:
- Optional checks that shouldn't block merging
- Experimental tools still under evaluation
- Flaky test suites you're in the process of stabilizing

A job with `continue-on-error: true` that fails shows as **amber** (warning) rather than red.

---

## `container` — run the job inside a Docker container

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    container:
      image: node:20
      credentials:
        username: ${{ secrets.REGISTRY_USER }}
        password: ${{ secrets.REGISTRY_TOKEN }}
      env:
        NODE_ENV: production
      ports:
        - 80
      volumes:
        - ${{ github.workspace }}:/workspace
```

This runs all steps inside the specified container rather than directly on the runner. The runner still provisions an Ubuntu VM — it just spawns a container for isolation.

---

## `services` — sidecar containers

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: ${{ secrets.DB_PASSWORD }}
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - run: npm test
        env:
          DATABASE_URL: postgres://postgres:${{ secrets.DB_PASSWORD }}@localhost:5432/test
```

Services run alongside your job. GitHub automatically sets up a Docker network so your steps can reach the service at `localhost:<port>`.

[← Back to index](../index.md)
