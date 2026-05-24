# Environments

Environments group secrets and variables by deployment target (staging, production, etc.) and add protection rules that gate access. They're the standard way to model deployment stages in GitHub Actions.

---

## Creating an environment

**Repo → Settings → Environments → New environment**

Give it a name: `staging`, `production`, `qa`, `development`. The name is used in the workflow's `environment:` key.

Environments are public to the repo — anyone with read access can see the environment name, but secrets are encrypted and protection rules are enforced.

---

## Using an environment in a workflow

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production           # targets the "production" environment
    steps:
      - run: ./deploy.sh
```

When a job references an environment, it gets access to:

- The environment's **secrets** (via `${{ secrets.NAME }}`)
- The environment's **variables** (via `${{ vars.NAME }}`)
- The environment's **protection rules** (must pass before the job runs)

---

## Environment-specific secrets

Add secrets under an environment:

**Repo → Settings → Environments → (click environment) → Environment secrets**

```yaml
jobs:
  deploy-staging:
    environment: staging
    env:
      DEPLOY_URL: ${{ secrets.STAGING_DEPLOY_URL }}
    steps:
      - run: ./deploy.sh

  deploy-production:
    environment: production
    env:
      DEPLOY_URL: ${{ secrets.PROD_DEPLOY_URL }}
    steps:
      - run: ./deploy.sh
```

Each environment can have a different value for the same secret name. This is the primary reason to use environments — production credentials shouldn't be available to the staging deployment.

---

## Environment-specific variables

Same concept, but for non-sensitive config:

```yaml
jobs:
  deploy-staging:
    environment: staging
    env:
      URL: ${{ vars.DEPLOY_URL }}         # https://staging.example.com
      LOG_LEVEL: ${{ vars.LOG_LEVEL }}    # debug

  deploy-production:
    environment: production
    env:
      URL: ${{ vars.DEPLOY_URL }}         # https://example.com
      LOG_LEVEL: ${{ vars.LOG_LEVEL }}    # warn
```

---

## Deployment tracking

When a job targets an environment, every run appears in the **Deployments** tab:

**Repo → Deployments**

Each deployment shows:
- Which environment it targeted
- The commit SHA deployed
- The workflow run that triggered it
- Whether it succeeded or failed
- An optional clickable URL

### Setting the deployment URL

```yaml
jobs:
  deploy:
    environment:
      name: production
      url: ${{ steps.deploy.outputs.url }}       # shown in the Deployments tab
    steps:
      - id: deploy
        run: |
          ./deploy.sh
          echo "url=https://example.com" >> $GITHUB_OUTPUT
```

The URL appears as a clickable link in the Deployments tab and on the PR timeline. This is how you get "View deployment" buttons on your PRs.

---

## Environment in the UI

Each environment's page shows:

- **Deployment history**: all runs that targeted this environment, with status
- **Secrets**: encrypted, not viewable after creation
- **Variables**: visible config values
- **Protection rules**: configured reviewers, wait timer, branch restrictions
- **Deployment branches**: which branches can deploy to this environment

---

## Best practices for environments

1. **Always use environments for production**. Direct `secrets.PROD_TOKEN` at the repo level defeats the purpose. Put them in a `production` environment.

2. **Use environments for staging too**. Even if you don't add reviewers, it gives you the Deployments tab history.

3. **Separate secrets by environment, not by name**:

```yaml
# Good — secret name is the same, environment scopes it
environment: staging
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}     # staging value

environment: production
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}     # different value — production
```

4. **Add URLs to deployments**. A deploy job that sets `url` creates a clickable link that your team will use constantly. Don't skip it.

5. **Review deployment history regularly**. The Deployments tab is an audit trail — who deployed what and when.

---

## Environment and the API

```bash
# List environments
gh api repos/owner/repo/environments

# Get a specific environment
gh api repos/owner/repo/environments/production

# Create an environment
gh api repos/owner/repo/environments/production -f wait_timer=30

# List deployments for an environment
gh api repos/owner/repo/deployments -f environment=production
```

[← Back to index](../index.md)
