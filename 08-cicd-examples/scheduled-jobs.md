# Scheduled Jobs & Cron

Scheduled workflows run automatically at fixed times — useful for nightly builds, dependency updates, stale issue management, and periodic maintenance tasks.

---

## Cron syntax

```yaml
on:
  schedule:
    - cron: 'minute hour day month weekday'
```

Five fields separated by spaces:

| Field | Values | Special characters |
|-------|--------|-------------------|
| minute | 0–59 | `*` `,` `-` `/` |
| hour | 0–23 | `*` `,` `-` `/` |
| day of month | 1–31 | `*` `,` `-` `/` |
| month | 1–12 (or JAN–DEC) | `*` `,` `-` `/` |
| day of week | 0–6 (0=Sunday) (or SUN–SAT) | `*` `,` `-` `/` |

### Common cron expressions

| Schedule | Expression | Meaning |
|----------|-----------|---------|
| Every 5 minutes | `*/5 * * * *` | Good for testing |
| Every hour | `0 * * * *` | Hourly check |
| Daily at 3 AM | `0 3 * * *` | Off-peak nightly build |
| Weekdays at 9 AM | `0 9 * * 1-5` | Business hours only |
| Monday at 8 AM | `0 8 * * 1` | Start of week |
| Every 6 hours | `0 */6 * * *` | Four times a day |
| First day of month | `0 0 1 * *` | Monthly report |

---

## Caveats and limitations

### Runs on the default branch only

Scheduled workflows always run on the **default branch** (usually `main`). You can't schedule a workflow on a feature branch.

### No guaranteed start time

GitHub schedules runs around the cron time, but high load can delay execution by **minutes to hours**. For time-critical tasks, use a self-hosted runner with a cron daemon, or an external scheduler (AWS EventBridge, GCP Cloud Scheduler) that triggers via `workflow_dispatch` via the API.

### 60-day inactivity rule

If a repository has no commits or other activity for **60 days**, scheduled workflows are automatically disabled. The repo owner receives an email notification. Activity (any push or workflow run) re-enables the schedules.

### Minimum interval is 5 minutes

You can't schedule a workflow more frequently than every 5 minutes. If you need sub-minute polling, use an external scheduler.

### Cron uses UTC

All cron expressions are evaluated in UTC. `0 9 * * *` is 9 AM UTC — which might be 2 AM in California or 6 PM in Tokyo. Always document the intended timezone in comments:

```yaml
on:
  schedule:
    - cron: '0 9 * * 1-5'    # 9 AM UTC = 5 AM ET, weekdays
```

---

## Examples

### Nightly full test suite

Run the full matrix (expensive) only at night; fast smoke tests on PRs:

```yaml
name: Nightly Full Suite

on:
  schedule:
    - cron: '0 3 * * *'         # 3 AM UTC daily
  workflow_dispatch:             # also allow manual trigger

jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run test:full
```

### Automated dependency updates (Dependabot alternative)

```yaml
name: Update Dependencies

on:
  schedule:
    - cron: '0 6 * * 1'         # Every Monday at 6 AM UTC

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npx npm-check-updates -u

      - run: npm install

      - run: npm test

      - uses: peter-evans/create-pull-request@v7
        with:
          title: 'chore: update dependencies'
          branch: chore/deps-update
          commit-message: 'chore: update npm dependencies'
          body: |
            Automated dependency update.
            - Run `npx npm-check-updates -u`
            - Tests pass
```

### Stale issue cleanup

```yaml
name: Close Stale Issues

on:
  schedule:
    - cron: '0 8 * * 1'         # Every Monday at 8 AM UTC

jobs:
  stale:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - uses: actions/stale@v9
        with:
          days-before-stale: 60
          days-before-close: 7
          stale-issue-message: 'This issue is stale because it has been open 60 days with no activity.'
          exempt-issue-labels: 'pinned,security'
          exempt-pr-labels: 'pinned'
```

### Nightly security audit

```yaml
name: Security Audit

on:
  schedule:
    - cron: '0 4 * * *'         # 4 AM UTC daily

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - run: npm audit --audit-level=high
        continue-on-error: true    # report but don't fail the build

      - uses: github/codeql-action/analyze@v3
```

### Daily data backup

```yaml
name: Daily Backup

on:
  schedule:
    - cron: '0 2 * * *'         # 2 AM UTC daily

jobs:
  backup:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - name: Run backup script
        run: ./scripts/backup-database.sh
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL_READONLY }}

      - uses: actions/upload-artifact@v4
        with:
          name: backup-${{ github.run_id }}
          path: backup/
          retention-days: 30
```

---

## Testing scheduled workflows

```yaml
on:
  schedule:
    - cron: '0 3 * * *'
  workflow_dispatch:               # always add this for testing
```

Push the workflow to `main`, then go to the Actions tab and manually trigger it via "Run workflow". This tests the job logic without waiting for the cron to fire.

To test the cron expression itself:
- Push to main and wait
- Or use [crontab.guru](https://crontab.guru) to verify the expression

---

## Key takeaways

1. **Always add `workflow_dispatch`** alongside `schedule` — manual testing without waiting for the timer
2. **Scheduled workflows run on the default branch only**
3. **Start times are best-effort** — don't depend on exact timing
4. **60 days of repo inactivity disables schedules** — they re-enable automatically on activity
5. **Cron is in UTC** — document the intended timezone in a comment

[← Back to index](../index.md)
