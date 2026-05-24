# Running Your First Workflow

You've written a workflow file — now let's make it run. This page walks through every way to start a workflow and what happens behind the scenes.

## Triggering a workflow

### 1. Push event (automatic)

The most common trigger. Commit your workflow file to `.github/workflows/` and push:

```bash
git add .github/workflows/ci.yml
git commit -m "Add CI workflow"
git push origin main
```

The workflow starts **immediately after the push reaches GitHub**. You'll see it appear in the Actions tab within seconds.

### 2. Pull request event (automatic)

When a PR is opened, or new commits are pushed to an open PR, workflows with `on: pull_request` run:

```yaml
on:
  pull_request:
    branches: [main]
```

The workflow runs against the **merged result** of the PR branch and the target branch — so you're testing what the code would look like after merging, not just the PR branch in isolation.

### 3. Manual trigger (`workflow_dispatch`)

Add this to let anyone run the workflow from the Actions tab with a button click:

```yaml
on:
  workflow_dispatch:
    inputs:
      log-level:
        description: 'Log level'
        required: true
        default: 'info'
        type: choice
        options: [debug, info, warning]
```

To run it: go to the **Actions** tab → select the workflow → **Run workflow** button.

### 4. Scheduled (cron)

```yaml
on:
  schedule:
    - cron: '0 9 * * 1-5'    # 9 AM UTC, Monday–Friday
```

Cron schedules run on the **default branch** (usually `main`). The shortest interval is every 5 minutes. Scheduled workflows may be delayed during high load and can be disabled by GitHub if the repo has no activity for 60 days.

### 5. External events

```yaml
on:
  issues:
    types: [opened, closed]
  release:
    types: [published]
  workflow_call:              # called by another workflow
```

## What happens when a workflow runs

```
You push to GitHub
       │
       ▼
GitHub evaluates: does any workflow's 'on' block match this event?
       │
       ▼ YES
A "workflow run" is created (visible in the Actions tab)
       │
       ▼
For each job in the workflow:
  ├─ GitHub provisions a fresh virtual machine (the runner)
  ├─ The runner clones your repo (if checkout is used)
  ├─ Each step executes in order
  ├─ Step output is streamed live to the Actions tab
  └─ The VM is destroyed (nothing persists between runs)
```

## Your first run — step by step

1. **Create** `.github/workflows/hello.yml` with the content from the [hello-world example](../examples/hello-world/.github/workflows/hello.yml).

2. **Commit and push** to your repository's default branch.

3. **Open GitHub** → your repo → **Actions** tab. You'll see the workflow appear, with a yellow `●` (running) indicator.

4. **Click the run** to watch the logs stream in real time. Each step expands to show its output.

5. When complete, a green `✓` means success. A red `✕` means something failed — click into the failed step to see the error.

## Troubleshooting first-run issues

| Problem | Likely fix |
|---------|-----------|
| Workflow doesn't appear in Actions tab | Check the file is in `.github/workflows/` and has `.yml` extension |
| "Workflow does not exist" error | The file wasn't pushed, or it's on a branch that doesn't match the `on` filter |
| Job stuck on "Queued" | Public repos: free concurrency limits apply. Private repos: you may have exhausted your included minutes. |
| `permission denied` errors | Add `permissions:` block or check repo settings (Settings → Actions → General) |

## Pro tip: start with `workflow_dispatch`

For your first workflow, include `workflow_dispatch` alongside `push`. That way you can trigger it manually without needing to push a new commit every time you tweak the YAML:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:              # lets you click "Run workflow" to re-run
```

[← Back to index](../index.md)
