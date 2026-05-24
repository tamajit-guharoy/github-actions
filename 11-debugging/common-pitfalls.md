# Common Pitfalls

A catalog of mistakes that GitHub Actions beginners (and veterans) make frequently — what they look like, why they happen, and how to fix them.

---

## YAML indentation errors

**Symptom:** Workflow won't even start, or GitHub shows "Invalid workflow file."

**Cause:** YAML is indentation-sensitive. Mixing tabs and spaces, or an extra space, breaks parsing.

```yaml
# WRONG — inconsistent indentation
jobs:
  build:
  runs-on: ubuntu-latest    # should be indented under build

# Correct
jobs:
  build:
    runs-on: ubuntu-latest
```

**Fix:** Use 2 spaces consistently. Never use tabs. Most editors have a "convert tabs to spaces" setting. Use a YAML linter ([yamllint](https://github.com/adrienverge/yamllint)) or your editor's YAML validation.

---

## Missing `actions/checkout`

**Symptom:** Step fails with "No such file" when trying to access your source code.

```yaml
steps:
  - run: npm test          # fails — no code to test
```

**Cause:** The runner starts with an **empty directory**. `actions/checkout` clones your repo.

**Fix:** Add it as the first step (almost always):

```yaml
steps:
  - uses: actions/checkout@v4
  - run: npm test
```

---

## Using unpinned action versions

**Symptom:** Workflow breaks suddenly without any changes on your side.

**Cause:** Using `@main` or `@master` means you automatically get every change pushed to that branch — including breaking ones.

```yaml
# WRONG
- uses: actions/checkout@main

# Correct
- uses: actions/checkout@v4
```

**Fix:** Always pin to a tag: `@v4`, `@v5.1.0`, or a commit SHA `@a81bbbf`. Tags are the standard; SHAs are for security-sensitive environments.

---

## Secrets not available in PRs from forks

**Symptom:** Workflow runs fine on your branches but fails on external contributors' PRs. Secrets evaluate as empty strings.

**Cause:** GitHub blocks secrets from being accessible in `pull_request` events from public forks. This prevents exfiltration attacks.

```yaml
# On a fork PR, this resolves to an empty string
${{ secrets.NPM_TOKEN }}     # → "" (from fork)
```

**Fix:** Design workflows so fork PRs don't need secrets:

```yaml
# Use if: to skip steps that need secrets on fork PRs
- run: npm publish
  if: github.event.pull_request.head.repo.full_name == github.repository
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Or use `pull_request_target` (with extreme caution — see [events & triggers](../02-core-concepts/events-and-triggers.md)).

---

## GITHUB_TOKEN permission denied

**Symptom:** `403 Resource not accessible by integration` when the workflow tries to create a release, comment on an issue, etc.

**Cause:** The default `GITHUB_TOKEN` has limited write scope. If you haven't set explicit `permissions:`, the defaults vary by repo and org settings.

**Fix:** Add the required permission:

```yaml
permissions:
  contents: write       # to create releases, push tags
  issues: write         # to comment on issues
  pull-requests: write  # to comment on PRs, add labels
```

Or, if working with a different repo, use a PAT instead of `GITHUB_TOKEN`.

---

## Cache misses and exploding cache

### Cache never hits

**Symptom:** Every run downloads all dependencies from scratch. Logs show "Cache not found."

**Cause 1:** `hashFiles()` returns a different value because the lock file changed. Normal — but check if a tool is auto-formatting `package-lock.json` on install (npm 7+ does this).

**Cause 2:** Caching with `npm install` instead of `npm ci`. `npm install` can modify the lock file, invalidating future caches.

**Fix:** Use `npm ci` (or `pip install` from a locked requirements file):

```yaml
- run: npm ci    # clean install — respects lockfile, doesn't modify it
```

### Cache exceeds 10 GB

**Symptom:** Older caches are evicted. The run is slow after a cache eviction.

**Cause:** Each new cache key creates a new cache entry. If you change the lock file daily, you get daily new caches — filling the 10 GB limit.

**Fix:** Use `restore-keys` to fall back to a close match:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-       # fallback — restore newest partial match
```

---

## Concurrency blocking itself

**Symptom:** A second push queues indefinitely behind the first, or jobs are mysteriously skipped.

**Cause:** A concurrency group that's too broad:

```yaml
concurrency:
  group: ci            # ALL runs share this group — only one at a time
```

**Fix:** Scope the group to the branch or PR:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

---

## `if: always()` needed for artifact upload on failure

**Symptom:** Artifacts are only uploaded when all previous steps succeed. Failed test runs have no reports to download.

**Cause:** By default, a step is skipped if any previous step failed. `if: always()` overrides this.

```yaml
steps:
  - run: npm test           # if this fails...
  - uses: actions/upload-artifact@v4    # ...this is skipped
    with:
      name: test-results
      path: junit.xml
```

**Fix:**

```yaml
steps:
  - run: npm test
  - uses: actions/upload-artifact@v4
    if: always()            # runs even when npm test fails
    with:
      name: test-results
      path: junit.xml
```

---

## Working directory not what you expect

**Symptom:** Steps run in the wrong directory, `npm test` can't find `package.json`.

**Cause:** The default working directory is `$GITHUB_WORKSPACE` (the repo root). If your project is in a subdirectory, you need to specify it.

**Fix per step:**

```yaml
- run: npm ci
  working-directory: ./frontend
```

**Fix for all steps:**

```yaml
jobs:
  build:
    defaults:
      run:
        working-directory: ./frontend
```

---

## Job-level `if:` with `needs` skips downstream jobs

**Symptom:** A downstream job is skipped with "Skipped — this job was skipped."

**Cause:** When a `needs` job is skipped (due to `if: false`), all jobs that `needs` it are also skipped by default.

```yaml
jobs:
  lint:
    if: github.ref == 'refs/heads/nonexistent'    # false → skipped

  test:
    needs: lint                                    # skipped too
```

**Fix:** If the downstream job should still run, guard it:

```yaml
jobs:
  test:
    needs: lint
    if: ${{ always() && !cancelled() }}
    # runs even if lint was skipped (not failed)
```

Or check the upstream result:

```yaml
if: ${{ always() && needs.lint.result != 'failure' }}
```

---

## OS-specific commands on a Linux runner

**Symptom:** `Set-ExecutionPolicy` or other Windows-cmd errors on what should be a cross-platform workflow.

**Cause:** Matrix job or shared step running a platform-specific command on the wrong OS:

```yaml
- run: npm test
- run: Set-ExecutionPolicy Bypass    # fails on ubuntu-latest
```

**Fix:** Guard with `runner.os`:

```yaml
- run: npm test
- run: Set-ExecutionPolicy Bypass -Scope Process
  if: runner.os == 'Windows'
- run: chmod +x ./script.sh
  if: runner.os != 'Windows'
```

---

## Shell differences

**Symptom:** Command works on Linux but fails on Windows, or vice versa.

**Default shells:**
- Linux, macOS: `bash`
- Windows: `pwsh` (PowerShell Core)

This means `export VAR=val` works on Linux but not on Windows, while `$env:VAR = 'val'` works on Windows but not on Linux.

**Fix:** Specify the shell explicitly when writing cross-platform commands:

```yaml
- run: echo "hello"          # works everywhere
  shell: bash
```

Or use a cross-platform scripting language:

```yaml
- run: |
    const { execSync } = require('child_process');
    execSync('npm test', { stdio: 'inherit' });
  shell: node {0}
```

---

## Matrix outputs only show the last leg

**Symptom:** `needs.test.outputs.result` only contains one value, not all matrix combinations.

**Cause:** When a matrix job produces outputs, only the **last completed** leg's outputs are available.

**Fix:** Aggregate outputs in a separate job using `upload-artifact` + `download-artifact`, or use `toJSON(needs.test)` to inspect all results.

---

## Quick reference: error messages and their fixes

| Error | Likely cause | Fix |
|-------|-------------|-----|
| `403 Resource not accessible by integration` | Missing `permissions:` | Add the required permission |
| `Workflow does not exist` | File not pushed, or wrong branch | Check path and branch filter |
| `No runner matching labels found` | Self-hosted runner offline or wrong labels | Check runner status and labels |
| `Secret is not defined` | Secret name mismatch | Check exact name (case-insensitive, underscores) |
| `cache not found` | First run, or lock file changed | Normal on first run; check restore-keys |
| `Unable to resolve action` | Action doesn't exist, or private repo | Check owner/repo spelling; for private, add token |
| `Job was skipped` | `needs` job was skipped or failed | Check upstream `if:` and add fallback |
| `Operation cancelled` | `cancel-in-progress: true` or manual cancel | Expected if you pushed again quickly |

[← Back to index](../index.md)
