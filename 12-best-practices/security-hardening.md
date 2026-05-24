# Security Hardening

Security in GitHub Actions is a shared responsibility. GitHub secures the platform; you secure your workflows. This page covers the practical steps to reduce attack surface and protect your code, secrets, and infrastructure.

---

## Principle of least privilege

Every workflow should have the minimum permissions it needs — nothing more.

```yaml
# Instead of accepting defaults, be explicit
permissions:
  contents: read        # enough for checkout + build
```

Add back only what specific jobs need:

```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write   # needed to create a release
    steps: [...]
```

If no job in the workflow needs write access, the workflow-level `permissions: contents: read` is sufficient for all jobs.

---

## Never use `pull_request_target` with checkout

`pull_request_target` runs in the **target repository's context** with full access to secrets. If you combine it with `actions/checkout` on untrusted PR code, an attacker can exfiltrate all your secrets.

```yaml
# DANGEROUS — DO NOT USE
on: pull_request_target
jobs:
  build:
    steps:
      - uses: actions/checkout@v4         # runs attacker's code with YOUR secrets
      - run: npm test
```

Safe use cases for `pull_request_target`:
- Commenting on PRs (`actions/github-script` only, no checkout)
- Adding labels based on changed files (use the API, not checkout)
- Running a trusted script from `main` against PR metadata

```yaml
# Safe — no checkout, only uses the API
on:
  pull_request_target:
    types: [opened]

jobs:
  greet:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              ...context.repo,
              issue_number: context.issue.number,
              body: 'Thanks for the PR!'
            });
```

---

## Pin actions to SHA hashes

Tags can be moved. A SHA is immutable.

```yaml
# Tag — can be moved
- uses: actions/checkout@v4

# SHA — immutable
- uses: actions/checkout@a81bbbf8298c0fa03ea29cdc473d45769f953675
```

For most teams, pinning to major tags (`@v4`) is a practical tradeoff between security and maintenance. For high-security environments (fintech, infrastructure, security tools), pin to SHAs and use Dependabot to keep them updated.

---

## Review third-party actions

Before using a community action:
1. Check the repo's stars, contributors, and last update date
2. Read the source code (especially for smaller actions — the entire might be 50 lines)
3. Verify the action only requests permissions it genuinely needs
4. Prefer actions from verified creators or well-known organizations

```yaml
# Prefer actions from:
# - github.com/actions/*        (GitHub official)
# - github.com/docker/*         (Docker official)
# - github.com/aws-actions/*    (AWS official)
# - github.com/azure/*          (Azure official)
# - github.com/google-github-actions/* (Google official)
```

---

## Secrets: scope and rotation

### Don't use repo-level secrets for production

Production credentials at the repo level are available to every workflow in the repo. A typo in a PR workflow could expose them.

Put production secrets in **environments** with protection rules:

```
Environment: production
├── Required reviewers: @senior-backend
├── Deployment branches: main
└── Secrets: PROD_AWS_KEY, PROD_DATABASE_URL
```

### OIDC over long-lived secrets

Every long-lived secret is a liability. OIDC replaces them with short-lived tokens:

```yaml
# Old: static AWS key in secrets
env:
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

# New: OIDC — no secrets
permissions:
  id-token: write
steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/GitHubActions
```

---

## Script injection prevention

Never interpolate untrusted input directly into shell commands:

```yaml
# DANGEROUS — issue title could contain `; rm -rf /`
- run: echo "${{ github.event.issue.title }}"

# Safe — pass through an environment variable instead
- run: echo "$ISSUE_TITLE"
  env:
    ISSUE_TITLE: ${{ github.event.issue.title }}
```

When an expression is interpolated directly into `run:`, it's evaluated before the shell sees it — the value becomes part of the script. When it's passed via `env:`, the shell treats it as data, never as code.

**Rule: user-controlled or external data always goes through `env:`, never through direct interpolation in `run:`.**

---

## Code scanning and secret scanning

Enable built-in security features:

### CodeQL

```yaml
name: CodeQL Analysis

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * 3'          # Wednesday at 6 AM

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: javascript
      - uses: github/codeql-action/analyze@v3
```

### Secret scanning push protection

Enable at: **Repo → Settings → Security → Secret scanning → Push protection**

This blocks pushes that contain high-confidence secret patterns (AWS keys, GitHub tokens, Slack webhooks, etc.).

---

## Artifact and log security

- **Artifacts in public repos are public**. Anyone with the URL can download them. Never upload secrets, `.env` files, or credentials as artifacts.
- **Log retention**: Logs can contain sensitive data. Set shorter retention for sensitive repos: **Settings → Actions → General → Artifact and log retention → 7 days**.
- **Debug logs contain more data**: When `ACTIONS_STEP_DEBUG` is on, the logs include environment variables and action inputs. Secrets are still masked, but variable names and non-secret values are visible.

---

## Fork PR safety

Workflows triggered by `pull_request` from public forks:
- Secrets are **not available** (empty strings)
- `GITHUB_TOKEN` has **read-only** permissions (unless overridden)
- Actions run in a restricted context

If a fork PR workflow needs write access (e.g., to add labels), use a **two-workflow pattern**:

```yaml
# Workflow 1: runs on pull_request (safe, no secrets)
on: pull_request
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test

# Workflow 2: runs on pull_request_target, adds labels via API only
on: pull_request_target
jobs:
  label:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.addLabels({
              ...context.repo,
              issue_number: context.issue.number,
              labels: ['needs-review']
            });
```

---

## Security checklist

- [ ] `permissions:` block set at workflow level (minimum: `contents: read`)
- [ ] No `pull_request_target` with `actions/checkout`
- [ ] Actions pinned to major tags (`@v4`) or SHAs
- [ ] Third-party actions reviewed before use
- [ ] Production secrets in environments with protection rules
- [ ] OIDC used instead of long-lived cloud credentials
- [ ] No user input interpolated directly in `run:` commands
- [ ] CodeQL or equivalent SAST enabled
- [ ] Secret scanning push protection enabled
- [ ] Artifacts reviewed for sensitive data
- [ ] `.github/workflows/` in CODEOWNERS for mandatory review

[← Back to index](../index.md)
