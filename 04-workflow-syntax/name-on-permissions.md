# name, on, permissions

These three top-level keys control the identity, trigger, and security boundary of a workflow.

---

## `name` — workflow display name

```yaml
name: CI
```

- **Optional.** If omitted, GitHub uses the file path relative to `.github/workflows/` (e.g., `ci` for `ci.yml`).
- Appears in the Actions tab, status badges, and notification emails.
- Keep it short and descriptive: `CI`, `Deploy to Production`, `Nightly Security Scan`.

---

## `on` — when the workflow runs

The `on` key (also written as the alias `true` in older docs) defines one or more **events** that trigger the workflow. Multiple events are handled as OR — the workflow runs if **any** listed event fires.

### Single event, no filter

```yaml
on: push
```

### Multiple events

```yaml
on: [push, pull_request, workflow_dispatch]
```

### Events with filters

When you need more control, use the object syntax:

```yaml
on:
  push:
    branches: [main]
    tags: ['v*']
    paths:
      - 'src/**'
      - 'package.json'
    paths-ignore:
      - 'docs/**'
      - '*.md'
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]
```

### Filter reference

| Filter | Applies to | Description |
|--------|-----------|-------------|
| `branches` | push, pull_request | Glob patterns; `'releases/**'`, `'v?.?.*'`, `'!main'` (exclude) |
| `branches-ignore` | push, pull_request | Exclude matching branches |
| `tags` | push | Glob patterns on git tags |
| `tags-ignore` | push | Exclude matching tags |
| `paths` | push, pull_request | Only run when files in these paths change |
| `paths-ignore` | push, pull_request | Skip when only these paths change |
| `types` | pull_request, issues, etc. | Activity types for webhook events |

### Common event types

| Event | Fires when |
|-------|-----------|
| `push` | A commit is pushed to any matching branch/tag |
| `pull_request` | A PR is opened, updated (`synchronize`), or reopened |
| `workflow_dispatch` | A user clicks "Run workflow" in the Actions tab |
| `schedule` | A cron expression fires (runs on default branch) |
| `workflow_call` | Another workflow calls this one via `uses` |
| `release` | A release is published, edited, etc. |
| `issues` | An issue is opened, closed, labeled, etc. |
| `pull_request_target` | Like `pull_request` but runs in the **base** context (dangerous — see security note below) |

### `pull_request_target` warning

`pull_request_target` runs with the **target repo's** permissions and secrets, even for PRs from forks. Only use it for workflows that need read access to secrets (e.g., commenting on PRs). Never check out or run untrusted PR code in this context — it lets a fork exfiltrate your secrets.

### `workflow_dispatch` with inputs

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'staging'
        type: choice
        options: [staging, production]
      dry-run:
        description: 'Skip actual deployment'
        required: false
        type: boolean
        default: true
```

Inputs are accessed via `${{ inputs.environment }}` or `${{ github.event.inputs.environment }}`.

### Activity types

Some events have subtypes. For example, `pull_request`:

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened, closed]
```

- `opened` — new PR created
- `synchronize` — new commits pushed to the PR branch
- `reopened` — closed PR re-opened
- `closed` — PR merged or closed (default runs on opened, synchronize, reopened only)

### Event payload

Every event carries a JSON payload available via `${{ github.event }}`. For a push event:

```yaml
steps:
  - run: echo "Pushed by ${{ github.event.pusher.name }}"
  - run: echo "${{ toJSON(github.event) }}"
```

---

## `permissions` — GITHUB_TOKEN scope

Every workflow run gets a `GITHUB_TOKEN` — a temporary authentication token scoped to the current repository. By default, this token has **read/write** access to most of the repository. Setting `permissions` explicitly is a security best practice.

### Setting permissions at the workflow level

```yaml
permissions:
  contents: read        # can only read repo contents
  issues: write         # can create/edit issues
  pull-requests: write  # can comment on PRs
```

This applies to **all jobs** in the workflow. If you don't set `permissions`, the defaults vary by whether the repo is private or public, and by organization settings.

### Setting permissions at the job level

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps: [...]
```

Job-level permissions override workflow-level settings for that job.

### Strictest: empty permissions

```yaml
permissions: {}         # GITHUB_TOKEN gets NO access
```

Then add back only what each job needs:

```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write   # needed to create a release
    steps: [...]
```

### Common permission scopes

| Scope | What it allows |
|-------|---------------|
| `contents: read` | Clone the repo, read files |
| `contents: write` | Push commits, create releases |
| `packages: write` | Push to GitHub Packages |
| `issues: write` | Create issue comments |
| `pull-requests: write` | Comment on, label, or close PRs |
| `pages: write` | Deploy to GitHub Pages |
| `id-token: write` | Request OIDC token (for cloud auth) |
| `actions: write` | Cancel workflow runs, dispatch events |
| `deployments: write` | Create deployment statuses |

### Checking current permissions

```yaml
steps:
  - run: |
      curl -s -H "Authorization: Bearer ${{ secrets.GITHUB_TOKEN }}" \
        https://api.github.com/repos/${{ github.repository }}/actions/permissions
```

[← Back to index](../index.md)
