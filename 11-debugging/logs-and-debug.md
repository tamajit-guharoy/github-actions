# Workflow Logs & Debug Logging

Every step in a workflow run produces logs. Understanding how to read them, how to enable debug output, and where to find extra diagnostics is the first skill for troubleshooting broken workflows.

---

## Accessing logs

### Actions tab → run → job → step

```
Actions tab
  └── Click the workflow run (e.g., "Node.js CI #47")
        └── Click a job in the left sidebar (e.g., "test (20)")
              └── Click a step to expand its log
```

### Raw logs

From the job view, click the ⚙ gear → **View raw logs**. This downloads a complete text file — useful for `grep` or sharing with others outside GitHub.

### Logs via CLI

```bash
# View a run's log
gh run view RUN_ID --log

# Watch a run in real time
gh run watch RUN_ID

# List recent runs
gh run list --workflow ci.yml --limit 10
```

---

## Enabling debug logging

Normally, workflow steps print their own output. Debug logging adds extra information from the runner itself — which action versions resolved, what environment variables are set, exact commands executed.

### Step debug (`ACTIONS_STEP_DEBUG`)

Add this **secret** to your repo:

```
Name:  ACTIONS_STEP_DEBUG
Value: true
```

**Repo → Settings → Secrets and variables → Actions → New repository secret**

Once set, every step prints additional diagnostics. No YAML changes needed — the runner picks it up automatically.

This reveals:
- Exact shell commands executed (including `set -e` and other preamble)
- Input values passed to actions
- Environment variable values (secrets still masked)
- Action version resolution details

### Runner diagnostic logs (`ACTIONS_RUNNER_DEBUG`)

```
Name:  ACTIONS_RUNNER_DEBUG
Value: true
```

Adds runner-level diagnostics:
- Job assignment and queue timing
- Runner configuration details
- Action download and caching info
- Container setup and teardown

These appear as **extra steps** prepended to every job — "Set up job" becomes much more verbose.

### Removing debug mode

Delete the secret. Debug logs stop on the next run.

---

## Log groups — collapsible sections

Use `::group::` and `::endgroup::` workflow commands to organize logs:

```yaml
steps:
  - run: |
      echo "::group::Installing dependencies"
      npm ci
      echo "::endgroup::"

      echo "::group::Running tests"
      npm test
      echo "::endgroup::"
```

Each group appears as a collapsible section in the log viewer. The group title is the text after `::group::`.

From JavaScript (`@actions/core`):

```javascript
core.startGroup('Installing dependencies');
// ... output ...
core.endGroup();
```

---

## Job summaries

The job summary appears on the run summary page. Write to `$GITHUB_STEP_SUMMARY`:

```yaml
steps:
  - name: Generate summary
    run: |
      echo "## Test Results" >> $GITHUB_STEP_SUMMARY
      echo "| Suite | Status | Duration |" >> $GITHUB_STEP_SUMMARY
      echo "|-------|--------|----------|" >> $GITHUB_STEP_SUMMARY
      echo "| Unit  | ✅ Pass | 12s    |" >> $GITHUB_STEP_SUMMARY
      echo "| Integration | ❌ Fail | 45s |" >> $GITHUB_STEP_SUMMARY
```

Markdown is supported. Use summaries for:
- Test results overview
- Coverage percentages
- Deployment URLs
- Environment diff output

Summaries persist after the run completes and are visible without expanding individual jobs.

---

## Annotations — inline warnings and errors

Use `::warning::` and `::error::` to create file-level annotations:

```yaml
steps:
  - run: |
      echo "::warning file=src/app.js,line=42::This function is deprecated"
      echo "::error file=src/main.js,line=10::Missing error handling"
```

```
File               Line    Annotation
src/app.js         42      ⚠ This function is deprecated
src/main.js        10      ❌ Missing error handling
```

These appear on the run summary and on the PR Files Changed tab. Annotations with `::error::` fail the step.

---

## Log inspection strategies

### Find the exact command that failed

1. Enable `ACTIONS_STEP_DEBUG`
2. Re-run the failed job
3. Expand the failing step
4. Look for `##[debug]` lines — the runner prints the exact shell script it's about to execute

### Compare a working run to a failing run

```bash
gh run view WORKING_RUN_ID --log > working.log
gh run view FAILING_RUN_ID --log > failing.log
diff working.log failing.log
```

### Check environment differences

```yaml
steps:
  - run: env | sort
  - run: node --version
  - run: npm --version
```

Environment drift between local and CI is the #1 source of "works on my machine." Print everything early.

---

## Common log patterns

### Action version resolution

```
##[debug] Downloading action 'actions/checkout@v4'
##[debug] Resolved 'actions/checkout@v4' to 'actions/checkout@v4.2.2'
```

If a `@main` reference resolves to something unexpected, this shows what was actually downloaded.

### Secret masking

```
Run echo $MY_SECRET
echo ***
```

Secrets are masked. If you see the actual value, the masking mechanism failed — rotate the secret immediately.

### Job queue delay

```
##[debug] Waiting for a runner to pick up this job...
##[debug] Job is in queue for 47 seconds
```

If jobs consistently queue for minutes, check:
- Runner availability (self-hosted offline?)
- Concurrency limits (are runs piling up in a concurrency group?)
- Account concurrency cap (free plan: 20 concurrent jobs)

---

## Workflow run logs via API

```bash
# Get run details
gh api repos/owner/repo/actions/runs/RUN_ID

# Get all jobs for a run
gh api repos/owner/repo/actions/runs/RUN_ID/jobs

# Download logs for a run (returns a zip)
gh api repos/owner/repo/actions/runs/RUN_ID/logs --output logs.zip

# Download logs for a specific attempt
gh api repos/owner/repo/actions/runs/RUN_ID/attempts/2/logs
```

---

## Retention

Logs are retained for:
- **Public repos**: 90 days
- **Private repos**: 90 days (configurable: 1–400 days in repo settings)

**Settings → Actions → General → Artifact and log retention**

[← Back to index](../index.md)
