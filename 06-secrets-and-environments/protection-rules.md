# Environment Protection Rules

Protection rules gate access to environments. When a job targets a protected environment, the job pauses until all rules are satisfied. This is how you prevent accidental deployments and enforce review workflows.

---

## Available protection rules

Configured per environment: **Repo → Settings → Environments → (environment)**

### Required reviewers

Up to **6 people or teams** must approve before the job runs.

```
Deploy to production
       │
       ▼
[ Required reviewers: @alice, @backend-team ]
       │
       ▼ (one must approve)
       │
Job starts
```

- Any **one** of the listed reviewers can approve
- Reviewers are notified by email and GitHub Notifications
- Approval is per-run — each run requires a fresh approval
- The approving user must have **read access** to the repo

### Wait timer

A mandatory delay (0–43,200 seconds = up to 12 hours) before the job starts. The timer begins after any reviewer approvals.

```yaml
# Environment config:
# Required reviewers: none
# Wait timer: 30 minutes
---
jobs:
  deploy:
    environment: production           # pauses for 30 minutes before running
```

Useful for:
- Giving on-call time to react before a deployment
- Staggering deployments across time zones
- "Deploy tomorrow morning" workflows (set 12-hour timer)

### Deployment branches

Restrict which branches can deploy to this environment:

```
Deployment branches: main, release/*
```

If a workflow on a different branch tries to deploy, the job is **skipped** — it doesn't even queue.

### Custom protection rules (GitHub Enterprise)

Enterprise customers can integrate external approval systems. These appear as additional rules in the environment config.

---

## Multiple rules combine

All configured rules must be satisfied:

```
Deploy to production
       │
       ▼
[ Required reviewers: @alice ]       ← must approve
       │
       ▼
[ Wait timer: 10 minutes ]           ← must elapse
       │
       ▼
[ Deployment branches: main ]        ← must match
       │
       ▼
Job starts
```

The order of evaluation is:
1. Branch check (immediate skip if wrong branch)
2. Reviewer approval (pauses until approved)
3. Wait timer (pauses for the configured duration)
4. Job proceeds

---

## Skipping protection rules

A job that references an environment but has no protection rules configured runs immediately — no gate, no delay. The job still gets the environment's secrets and variables.

To bypass protection rules entirely (e.g., for an emergency hotfix), an admin can temporarily remove the rules from the environment settings. This is an explicit action visible in the audit log.

There is no "skip rules" flag in the YAML or API. If you find yourself wanting to skip frequently, your rules are too strict for your deployment cadence.

---

## Environment and branch protection together

Environment protection rules control **when** a job runs. Branch protection rules control **what** can be merged. They complement each other:

| Concern | Tool |
|---------|------|
| Require CI passing before merge | Branch protection (status checks) |
| Require review before merging code | Branch protection (PR reviews) |
| Require review before deploying | Environment protection (required reviewers) |
| Restrict which branch deploys where | Environment protection (deployment branches) |
| Require clean main before deploy | Branch protection (up-to-date branches) |

---

## Example: production protection

```
Environment: production
├── Required reviewers: @senior-backend (team)
├── Wait timer: 5 minutes
├── Deployment branches: main
└── Secrets: PROD_DATABASE_URL, PROD_AWS_KEY, etc.
```

Workflow:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
          AWS_ACCESS_KEY_ID: ${{ secrets.PROD_AWS_KEY }}
```

This deployment:
1. Only runs from `main`
2. Pauses until someone from `@senior-backend` approves
3. Waits 5 minutes after approval
4. Then runs the deploy script with production credentials

---

## Approval API

Reviewers can approve via the GitHub UI or via the API:

```bash
# List pending approvals for a run
gh api repos/owner/repo/actions/runs/RUN_ID/pending_deployments

# Approve a pending deployment
gh api repos/owner/repo/actions/runs/RUN_ID/pending_deployments \
  -f environment_ids[]=ENV_ID \
  -f state=approved \
  -f comment="Deploying after QA sign-off"
```

This lets you build custom approval dashboards or integrate with Slack/Teams.

[← Back to index](../index.md)
