# Concurrency Control

The `concurrency` key ensures only one instance of a workflow or job runs at a time within a given group. Use it to prevent race conditions, wasted runner minutes, and conflicting deployments.

---

## Basic concurrency

```yaml
concurrency:
  group: deploy
  cancel-in-progress: false
```

Only one run in the `deploy` group at a time. New runs **queue** until the active run finishes.

---

## `cancel-in-progress` — cancel old runs

```yaml
concurrency:
  group: deploy
  cancel-in-progress: true
```

If a new run starts while an old run is still active, the old run is **cancelled**. Use this when only the latest commit matters — like deploying to staging or running PR checks.

---

## Per-branch concurrency

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

This is the most common pattern. It creates a separate concurrency group for each branch (or tag):

- `CI-refs/heads/main`
- `CI-refs/heads/feature-x`
- `CI-refs/tags/v1.0`

Pushing to `feature-x` cancels any in-progress run on `feature-x` but leaves `main` alone.

## Per-PR concurrency

```yaml
concurrency:
  group: pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

Each PR gets its own group. New pushes to the same PR cancel the old CI run — saving minutes when someone pushes 5 commits in quick succession.

---

## Per-environment concurrency

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    concurrency:
      group: deploy-${{ github.event.inputs.environment || 'staging' }}
      cancel-in-progress: false         # never cancel a deploy in flight
    steps:
      - run: ./deploy.sh
```

Deployments to the same environment are serialized. A new deploy to `staging` waits for the current deploy to finish. Deployments to different environments run in parallel.

---

## Job-level vs workflow-level concurrency

### Workflow level

```yaml
name: CI

on: push

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint: ...
  test: ...
  deploy: ...
```

The entire workflow run is the unit of concurrency. A new push cancels the whole previous run — lint, test, and deploy.

### Job level

```yaml
jobs:
  lint: ...
  test: ...

  deploy:
    runs-on: ubuntu-latest
    concurrency:
      group: deploy-${{ github.ref }}
      cancel-in-progress: false
    steps: ...
```

Only the `deploy` job has concurrency control. `lint` and `test` run freely. This is useful when most jobs are cheap and parallel-safe, but one job (deploy) modifies shared state.

---

## Queueing behavior

When `cancel-in-progress: false` and a run is active:

```
Run 1 — active
Run 2 — queued (waits for Run 1 to finish)
Run 3 — queued (behind Run 2)
Run 4 — queued (behind Run 3)
```

All queue. When Run 1 finishes, Run 2 starts. There's no limit to the queue length — runs wait indefinitely.

When `cancel-in-progress: true`:

```
Run 1 — active
Run 2 arrives → Run 1 is cancelled. Run 2 starts.
Run 3 arrives → Run 2 is cancelled. Run 3 starts.
```

Only the latest matters. This is ideal for PR checks and staging deployments.

---

## Concurrency group naming conventions

| Pattern | Group | When to use |
|---------|-------|-------------|
| `${{ github.workflow }}-${{ github.ref }}` | `CI-refs/heads/main` | Per-branch CI |
| `pr-${{ github.event.pull_request.number }}` | `pr-42` | Per-PR checks |
| `deploy-${{ inputs.environment }}` | `deploy-production` | Per-environment deploys |
| `pages` | `pages` | Static string (e.g., Pages deploy) |
| `${{ github.workflow }}-${{ github.ref }}-${{ matrix.os }}` | `CI-main-ubuntu-latest` | Per-branch + matrix OS |

---

## Concurrency and reusable workflows

Concurrency set in the **caller** applies to the entire run, including the reusable workflow:

```yaml
# Caller
concurrency:
  group: deploy-all

jobs:
  a:
    uses: ./.github/workflows/deploy-a.yml
  b:
    uses: ./.github/workflows/deploy-b.yml
```

Both reusable workflows share the `deploy-all` group. Only one runs at a time.

To allow parallel reusable workflows, use more specific groups at the job level or inside the reusable workflow.

---

## When concurrency won't help

- **Different workflows targeting different branches**: `CI-refs/heads/main` and `CD-refs/heads/main` don't conflict because the group names differ.
- **Jobs within the same run**: Concurrency only applies across different runs, not to jobs within the same run. Use `needs` for ordering within a run.
- **Override desired**: If you genuinely need concurrent deployments (blue-green, canary), don't use concurrency. Or use separate environments.

---

## Real example from the tutorial

The [GitHub Pages deploy workflow](../examples/docker-app/.github/workflows/deploy-github-pages.yml) uses:

```yaml
concurrency:
  group: pages
  cancel-in-progress: true
```

Pages deployments are strictly serial — there's no benefit to queuing old runs when a new one is available.

[← Back to index](../index.md)
