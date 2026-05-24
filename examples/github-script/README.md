# GitHub Script Examples

Workflows that use `actions/github-script` to interact with the GitHub API directly from JavaScript — no separate script files, no token management.

## Workflows

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `pr-welcome.yml` | `pull_request_target` (opened) | Posts a welcome comment, adds "needs-review" label, detects first-time contributors |
| `stale-manager.yml` | `schedule` (weekly) + `workflow_dispatch` | Closes stale issues inactive for 7+ days |
| `issue-triage.yml` | `issues` (opened) | Scans title/body for keywords and auto-labels (bug, enhancement, question, etc.) |

## How github-script works

```yaml
- uses: actions/github-script@v7
  with:
    script: |
      // 'github' is a pre-authenticated Octokit REST client
      // 'context' contains workflow metadata (repo, issue, actor, etc.)
      // 'core' provides logging, outputs, and summaries

      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body: 'Hello from JavaScript!'
      });
```

No `${{ secrets.GITHUB_TOKEN }}` needed — the action is already authenticated.

## Key concepts demonstrated

| Concept | Where to look |
|---------|--------------|
| Octokit REST API (`github.rest.*`) | All 3 workflow files |
| `context.issue.number`, `context.repo`, `context.actor` | `pr-welcome.yml` lines 30-32 |
| `context.payload` (full webhook event) | `pr-welcome.yml` line 33 |
| `core.summary` (job summary markdown) | `pr-welcome.yml` lines 55-62 |
| `core.info()` logging | Throughout |
| First-time contributor detection | `pr-welcome.yml` line 33 |
| `issues.listForRepo` with filters | `stale-manager.yml` lines 27-34 |
| `schedule` + `workflow_dispatch` combo | `stale-manager.yml` lines 14-15 |
| `issues` event trigger (non-PR) | `issue-triage.yml` line 9 |
| Safe `pull_request_target` (API only) | `pr-welcome.yml` line 17 |

## When to use github-script vs separate action

| Use github-script when... | Build a separate action when... |
|---------------------------|-------------------------------|
| The logic is short (<100 lines) | The logic is complex or reusable across repos |
| You need a few API calls | You need external npm dependencies |
| The workflow is the only consumer | You want to publish to Marketplace |
| You want zero setup (no build step) | You need type-checking, tests, CI for the action itself |

## Testing

For the `issue-triage` workflow: create a test issue with "bug" or "feature" in the title → the workflow adds labels automatically.

For the `pr-welcome` workflow: open a PR → a welcome comment appears.

For the `stale-manager` workflow: use **workflow_dispatch** from the Actions tab to run it manually.
