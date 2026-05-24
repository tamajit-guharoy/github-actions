# Events & Triggers

Events are what kick off a workflow. You define them with the `on` key.

## Common event types

| Event | Fires when... |
|-------|--------------|
| `push` | Code is pushed to the repo |
| `pull_request` | A PR is opened, updated, or reopened |
| `schedule` | A cron schedule is matched |
| `workflow_dispatch` | Manually triggered from the UI or API |
| `release` | A release is published |
| `issues` | An issue is opened, edited, or closed |
| `issue_comment` | A comment is added to an issue/PR |
| `workflow_call` | Called by another workflow (reusable) |

## Filtering events

Limit which branches, tags, or paths trigger the workflow:

```yaml
on:
  push:
    branches: [main, 'release/**']
    paths:
      - 'src/**'
      - 'package.json'
  pull_request:
    branches: [main]
    types: [opened, synchronize, ready_for_review]
```

## Workflow dispatch (manual trigger)

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deploy target'
        required: true
        type: choice
        options: [staging, production]
```

This adds a "Run workflow" button in the GitHub Actions tab with a dropdown input.

## Schedule (cron)

```yaml
on:
  schedule:
    - cron: '0 6 * * 1-5'    # weekdays at 6:00 AM UTC
```

Cron syntax: `minute hour day month weekday`. Scheduled workflows run on the default branch and may be delayed during high load.

## Multiple triggers

A workflow can listen to many events at once:

```yaml
on: [push, pull_request, workflow_dispatch]
```

---

[← Back to index](../index.md)
