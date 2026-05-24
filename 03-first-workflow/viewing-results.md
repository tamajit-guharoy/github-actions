# Viewing Workflow Results

Once a workflow runs, GitHub provides a rich UI for inspecting every detail — from high-level status to individual log lines.

## The Actions tab

Navigate to your repository on GitHub and click the **Actions** tab at the top.

```
┌──────────────────────────────────────────────────────────────┐
│  All workflows                                                │
│  ├── Node.js CI                         3 days ago  ✓ pass   │
│  ├── Python CI                          3 days ago  ✓ pass   │
│  └── Deploy to GitHub Pages             5 days ago  ✓ pass   │
│                                                               │
│  Click a workflow name to filter by that workflow.            │
│  Click a run to open the run summary.                         │
└──────────────────────────────────────────────────────────────┘
```

The left sidebar lists all workflows in the repo. The main area shows recent runs with status icons:

| Icon | Meaning |
|------|---------|
| `●` yellow | In progress / queued |
| `✓` green | Success — all jobs passed |
| `✕` red | Failure — at least one job failed |
| `○` grey | Cancelled — manually stopped or `cancel-in-progress` kicked in |
| `⏭` grey | Skipped — `needs` job failed, so this never ran |

## The run summary page

Click any run to see its summary. This page shows:

- **Trigger**: which event started the run (push, PR, schedule, etc.)
- **Branch and commit**: the SHA, author, and commit message
- **Job graph**: a visual map of jobs and their `needs` dependencies
- **Artifacts**: any uploaded files available for download (kept for 90 days by default)
- **Annotations**: warnings and errors surfaced by actions (e.g., deprecation notices)

## Job logs

Click any job in the sidebar to expand its step-by-step log:

```
Set up job                           2s
Check out repository                 3s
Set up Node.js                      5s
Install dependencies                12s
Run linter                          2s   ✓
Run tests                           8s
  ├── PASS  src/index.test.js
  │   ✓ GET / returns 200            2ms
  │   ✓ GET /health returns ok       1ms
  └── Tests: 2 passed, 2 total
Upload coverage report              3s
Complete job                        1s
```

Each step can be expanded to show the raw output. **Failed steps** are automatically expanded so the error is the first thing you see.

### Raw logs

Click the gear icon (⚙) in the top-right of the job log view and select **View raw logs**. This downloads the complete log as a text file — useful for searching large outputs or sharing with others.

## Debug logging

Add these secrets to your repository to enable verbose logging:

| Secret | Value | Effect |
|--------|-------|--------|
| `ACTIONS_STEP_DEBUG` | `true` | Extra step-level debug output |
| `ACTIONS_RUNNER_DEBUG` | `true` | Runner diagnostic logs |

No YAML changes needed — the runner picks these up automatically.

## Status badges

Add a badge to your README to show workflow status at a glance:

```markdown
![CI](https://github.com/USER/REPO/actions/workflows/WORKFLOW_FILE.yml/badge.svg)
```

For example:

```markdown
![CI](https://github.com/octocat/hello-world/actions/workflows/ci.yml/badge.svg)
```

The badge URL is:
```
https://github.com/{owner}/{repo}/actions/workflows/{filename}/badge.svg
```

You can also add a branch parameter:
```
.../badge.svg?branch=main
```

## Notifications

GitHub notifies you about workflow failures through:

- **Email**: failed workflows on watched repos send an email to the repo's watchers
- **GitHub Notifications**: the bell icon in the top-right of GitHub
- **Status checks on PRs**: every open PR shows the CI status directly below the PR title, and you can require passing checks before merging (branch protection rule)

## Retrying a failed run

If a run fails due to a transient issue (network timeout, flaky test):

1. Open the failed run in the Actions tab
2. Click **Re-run jobs** (top-right)
3. Choose:
   - **Re-run all jobs** — restart from scratch
   - **Re-run failed jobs** — only the ones that failed

Re-runs use the exact same commit SHA, so you're testing the same code.

[← Back to index](../index.md)
