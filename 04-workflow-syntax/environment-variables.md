# Environment Variables (`env`)

Environment variables let you pass configuration into your workflows at every level. They're available in shell commands and accessible in expressions via `${{ env.VAR }}`.

---

## Setting environment variables

### Workflow level

Available to **all jobs and steps** in the workflow:

```yaml
env:
  NODE_ENV: ci
  LOG_LEVEL: debug

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo $NODE_ENV          # ci
```

### Job level

Overrides workflow-level variables for that job:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      NODE_ENV: production              # overrides workflow-level NODE_ENV
    steps:
      - run: echo $NODE_ENV             # production
```

### Step level

Overrides both workflow and job-level variables for that step only:

```yaml
steps:
  - run: npm test
    env:
      CI: true
      NODE_OPTIONS: --max-old-space-size=4096
```

---

## Variable precedence

```
Step-level env   (highest priority — wins over everything)
  ↓
Job-level env
  ↓
Workflow-level env   (lowest priority)
```

If the same variable is set at multiple levels, the **most specific** one wins.

---

## Default environment variables

GitHub sets these automatically on every runner:

| Variable | Value | Example |
|----------|-------|---------|
| `CI` | `true` | Always set in GitHub Actions |
| `HOME` | User home directory | `/home/runner` (Linux), `C:\Users\runneradmin` (Windows) |
| `GITHUB_WORKFLOW` | Workflow name | `Node.js CI` |
| `GITHUB_RUN_ID` | Unique run ID | `1658821493` |
| `GITHUB_RUN_NUMBER` | Incrementing run number | `42` |
| `GITHUB_RUN_ATTEMPT` | Attempt number | `1` (re-runs increment) |
| `GITHUB_ACTION` | Current action name | `run` |
| `GITHUB_ACTIONS` | Always `true` | Distinguish local vs CI |
| `GITHUB_REPOSITORY` | `owner/repo` | `octocat/hello-world` |
| `GITHUB_REF` | Branch or tag ref | `refs/heads/main` |
| `GITHUB_REF_NAME` | Short ref name | `main` or `v1.0` |
| `GITHUB_REF_TYPE` | `branch` or `tag` | `branch` |
| `GITHUB_SHA` | Commit SHA | `ffac537e6cbbf934b08745a378932722df287a53` |
| `GITHUB_EVENT_NAME` | Trigger event | `push` |
| `GITHUB_EVENT_PATH` | Path to event payload | `/home/runner/work/_temp/_github_workflow/event.json` |
| `GITHUB_WORKSPACE` | Working directory | `/home/runner/work/my-repo/my-repo` |
| `GITHUB_ACTOR` | Username who triggered | `octocat` |
| `GITHUB_SERVER_URL` | GitHub URL | `https://github.com` |
| `GITHUB_API_URL` | API URL | `https://api.github.com` |
| `GITHUB_JOB` | Job ID | `test (20)` |
| `RUNNER_OS` | Operating system | `Linux`, `Windows`, `macOS` |
| `RUNNER_ARCH` | Architecture | `X64`, `ARM64` |
| `RUNNER_NAME` | Runner hostname | `fv-az123-456` |
| `RUNNER_TEMP` | Temp directory | `/home/runner/work/_temp` |
| `RUNNER_TOOL_CACHE` | Tool cache | `/opt/hostedtoolcache` |

---

## Setting variables dynamically — `$GITHUB_ENV`

Use `$GITHUB_ENV` to set an environment variable that persists across subsequent steps in the same job:

```yaml
steps:
  - name: Calculate version
    run: |
      echo "VERSION=$(date +%Y%m%d)-$(git rev-parse --short HEAD)" >> $GITHUB_ENV

  - name: Use the version
    run: echo "Building version $VERSION"     # now available

  - name: Use in another step
    run: docker build -t my-app:$VERSION .
```

Variables set via `$GITHUB_ENV` are **not available in the same step** — only in subsequent steps.

---

## Using context values as variables

```yaml
env:
  BRANCH_NAME: ${{ github.ref_name }}
  COMMIT_SHA: ${{ github.sha }}
  RUN_NUMBER: ${{ github.run_number }}
```

These are evaluated when the job starts and are static for the run.

---

## Configuration variables (`vars`)

Distinct from `env`, configuration variables are set in the repo/org UI and accessed via the `vars` context:

```yaml
env:
  DEPLOY_URL: ${{ vars.STAGING_URL }}
```

Set at: **Settings → Secrets and variables → Actions → Variables**.

Unlike secrets, `vars` are **not masked** in logs. Use them for non-sensitive config like URLs, feature flags, and default values.

Values can differ per **environment**:

```yaml
jobs:
  deploy-staging:
    environment: staging
    env:
      URL: ${{ vars.DEPLOY_URL }}         # staging-specific value
  deploy-prod:
    environment: production
    env:
      URL: ${{ vars.DEPLOY_URL }}         # production-specific value
```

---

## Secrets as environment variables

```yaml
steps:
  - run: deploy.sh
    env:
      API_KEY: ${{ secrets.API_KEY }}
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Secrets are **automatically masked** in logs. If a command echoes a secret value, GitHub replaces it with `***`. However, secrets in environment variables can still leak — never echo a secret-derived variable and avoid passing secrets to commands that log their arguments.

---

## Working directory (`working-directory`)

Not an environment variable, but closely related. Set the working directory for a step:

```yaml
steps:
  - run: npm ci
    working-directory: ./frontend

  - run: npm test
    working-directory: ./frontend
```

Use `defaults` to set it for all steps:

```yaml
defaults:
  run:
    working-directory: ./frontend
```

---

## Platform differences

### Setting variables on Windows

On Windows runners, use PowerShell syntax:

```yaml
jobs:
  build:
    runs-on: windows-latest
    env:
      MY_VAR: hello
    steps:
      - run: echo $env:MY_VAR               # PowerShell
      - run: echo %MY_VAR%                  # cmd (if shell: cmd)
      - run: echo $MY_VAR                   # bash (if shell: bash)
```

### Multi-line variables

```yaml
env:
  CERT: |
    -----BEGIN CERTIFICATE-----
    MIIB2TCCAX...
    -----END CERTIFICATE-----
```

---

## Real examples from the tutorial

```yaml
# Node.js CI — step-level CI flag
steps:
  - run: npm test
    env:
      CI: true
```

```yaml
# Docker build — secrets as env vars for login
steps:
  - uses: docker/login-action@v3
    with:
      username: ${{ secrets.DOCKERHUB_USERNAME }}
      password: ${{ secrets.DOCKERHUB_TOKEN }}
```

See the full workflows:
- [Docker Build & Push](../examples/docker-app/.github/workflows/docker-build-push.yml)

[← Back to index](../index.md)
