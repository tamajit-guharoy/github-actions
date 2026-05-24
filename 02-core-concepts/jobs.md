# Jobs

A **job** is a set of steps that execute on the same runner. Jobs are the main unit of parallelism in a workflow.

## Key properties

- Each job runs on a **fresh runner** (VM or container) — no shared state between jobs by default
- Jobs run **in parallel** unless you declare dependencies with `needs`
- If one job fails, dependent jobs are skipped (unless the job uses `if: always()`)

## Example: parallel vs sequential

```yaml
jobs:
  lint:                    # Job 1
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run lint

  test:                    # Job 2 — runs in parallel with lint
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm test

  deploy:                  # Job 3 — only after lint AND test succeed
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying..."
```

Execution order: `lint` and `test` start simultaneously → `deploy` waits for both.

## Job-level settings

| Setting | Purpose |
|---------|---------|
| `runs-on` | Runner type (OS, self-hosted label) |
| `needs` | Jobs that must complete first |
| `if` | Conditional execution |
| `env` | Environment variables scoped to the job |
| `strategy` | Matrix or parallelization strategy |
| `timeout-minutes` | Max runtime before automatic cancellation |
| `outputs` | Values to pass to dependent jobs |

## Sharing data between jobs

Jobs don't share a filesystem. To pass data between jobs, use:
- **Artifacts** (`actions/upload-artifact` / `actions/download-artifact`)
- **Job outputs** for small values like build IDs or SHA hashes
- **Cache** for dependencies that should persist across runs

---

[← Back to index](../index.md)
