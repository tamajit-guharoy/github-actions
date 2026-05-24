# Reusable Workflows

A reusable workflow is a workflow file that other workflows call. Instead of copy-pasting the same deploy logic into 10 repos, you write it once and call it like an action.

---

## Defining a reusable workflow

Create a workflow file with `on: workflow_call`:

```yaml
# .github/workflows/deploy.yml (in the shared repo)
name: Reusable Deploy

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      version:
        required: false
        type: string
        default: 'latest'
    secrets:
      DEPLOY_KEY:
        required: true
    outputs:
      url:
        value: ${{ jobs.deploy.outputs.url }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    outputs:
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4
      - id: deploy
        run: |
          echo "Deploying ${{ inputs.version }} to ${{ inputs.environment }}"
          echo "url=https://${{ inputs.environment }}.example.com" >> $GITHUB_OUTPUT
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
```

### Input types

| Type | Example |
|------|---------|
| `string` | `'production'` |
| `number` | `42` |
| `boolean` | `true` |
| `choice` | N/A (use `string` with validation) |

Secrets are declared in the `secrets:` block — they must be explicitly passed by the caller.

---

## Calling a reusable workflow

### Same repository

```yaml
# .github/workflows/main-ci.yml
name: Main CI

on:
  push:
    branches: [main]

jobs:
  deploy:
    uses: ./.github/workflows/deploy.yml
    with:
      environment: production
      version: ${{ github.sha }}
    secrets:
      DEPLOY_KEY: ${{ secrets.PROD_DEPLOY_KEY }}
```

### From another repository

```yaml
jobs:
  deploy:
    uses: my-org/shared-workflows/.github/workflows/deploy.yml@v1
    with:
      environment: production
    secrets:
      DEPLOY_KEY: ${{ secrets.PROD_DEPLOY_KEY }}
```

The reference format is `owner/repo/.github/workflows/workflow.yml@ref` where `ref` is a branch, tag, or commit SHA. Always pin to a tag (`@v1`) or SHA — never `@main`.

---

## Passing secrets to reusable workflows

Secrets aren't automatically inherited. Each must be passed explicitly:

```yaml
jobs:
  deploy:
    uses: my-org/shared-workflows/.github/workflows/deploy.yml@v1
    with:
      environment: production
    secrets:
      DEPLOY_KEY: ${{ secrets.PROD_DEPLOY_KEY }}
      SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
    # GITHUB_TOKEN is NOT passed unless listed here
```

The `GITHUB_TOKEN` is not passed automatically. If the reusable workflow needs it, pass it explicitly:

```yaml
secrets:
  token: ${{ secrets.GITHUB_TOKEN }}
```

---

## Permissions with reusable workflows

The **caller** workflow's permissions apply by default. The reusable workflow inherits the caller's permissions. To add more:

```yaml
# Caller
jobs:
  build:
    uses: ./.github/workflows/reusable-build.yml
    permissions:
      contents: read
      packages: write
```

Or set permissions inside the reusable workflow itself (only applies to actions from repos the user has access to).

---

## Outputs from reusable workflows

The reusable workflow declares outputs at the `workflow_call` level:

```yaml
# Reusable workflow
on:
  workflow_call:
    outputs:
      url:
        value: ${{ jobs.deploy.outputs.url }}
      version:
        value: ${{ jobs.build.outputs.version }}
```

The caller consumes them:

```yaml
jobs:
  deploy:
    uses: ./.github/workflows/deploy.yml
    with:
      environment: production
    secrets:
      DEPLOY_KEY: ${{ secrets.PROD_DEPLOY_KEY }}

  notify:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deployed to ${{ needs.deploy.outputs.url }}"
```

---

## Nesting reusable workflows

A reusable workflow can call another reusable workflow:

```yaml
# workflow A
on: workflow_call

jobs:
  lint:
    uses: ./.github/workflows/lint.yml
  test:
    needs: lint
    uses: ./.github/workflows/test.yml
```

Maximum nesting depth: **4 levels** (caller → A → B → C → D).

---

## Strategy: workload identity via OIDC

Reusable workflows + OIDC is a powerful pattern for shared deployment logic:

```yaml
# Shared deploy workflow — no secrets needed
on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/${{ inputs.environment }}
      - run: ./deploy.sh
```

Any repo in the org calls this — no AWS secrets needed, just the `id-token` permission.

---

## When to use reusable workflows vs composite actions

| | Reusable Workflow | Composite Action |
|---|-------------------|-----------------|
| Uses | `uses: owner/repo/.github/workflows/w.yml@v1` | `uses: owner/repo/action@v1` |
| Runs in | Separate job (own runner) | Inside the caller's job |
| Has its own `permissions:` | Yes | No (inherits caller) |
| Has `env:`, `runs-on:` | Yes | No |
| Can call other workflows | Yes | No |
| Secrets inheritance | Explicit (passed via `secrets:`) | Inherits caller's `secrets` |
| Best for | Cross-repo logic, different runners per step | Shared steps within a job |

---

## Limitations

- **Max 20 reusable workflow calls** per caller workflow (up to 4 levels deep × 20 calls)
- **Matrix + reusable**: You can combine them, but the reusable workflow is called once per matrix leg
- **No `runs-on` override**: The reusable workflow controls its own `runs-on`. The caller can't change it.
- **Secrets are explicit**: Easy to forget to pass `GITHUB_TOKEN`. The job fails with an authentication error — check the secrets mapping.

[← Back to index](../index.md)
