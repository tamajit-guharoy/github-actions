# Organization Secrets

Organization secrets are shared across multiple repositories. Instead of adding the same `NPM_TOKEN` to 50 repos, you create it once at the org level and grant access to the repos that need it.

---

## Creating organization secrets

**Organization → Settings → Secrets and variables → Actions → New organization secret**

Same format as repo secrets: **Name** (uppercase, underscores) and **Value** (encrypted).

## Access policies

When creating an org secret, you choose who can use it:

| Access policy | Behavior |
|---------------|----------|
| **All repositories** | Available to every repo in the org (current and future) |
| **Private repositories** | Available to private repos only |
| **Selected repositories** | You pick specific repos; only those can access it |

Choosing "Selected repositories" is the security-conscious default. Start narrow and expand as needed.

---

## How repos use org secrets

The workflow doesn't change — `${{ secrets.NAME }}` works identically whether the secret is at the repo or org level:

```yaml
steps:
  - uses: docker/login-action@v3
    with:
      username: ${{ secrets.DOCKERHUB_USERNAME }}    # could be org-level
      password: ${{ secrets.DOCKERHUB_TOKEN }}        # could be org-level
```

GitHub resolves the secret name from repo-level first, then org-level. If a repo has `DOCKERHUB_TOKEN` defined locally, that value is used instead of the org-level one.

---

## Precedence

```
Repo-level secret   (highest priority — wins over org)
  ↓
Organization-level secret   (used if no repo-level secret with the same name)
```

If both exist with the same name, the **repo-level secret wins**. This lets an org set a default while individual repos override it.

---

## Dependabot secrets

Dependabot runs in a separate context with its own secrets. Org-level Dependabot secrets are at:

**Organization → Settings → Secrets and variables → Dependabot → New organization secret**

These are available to Dependabot when it opens PRs for dependency updates. Dependabot can't access regular Actions secrets, so if your CI needs a token to install private packages, add it to Dependabot secrets too.

---

## Organization variables

Alongside secrets, you can set **organization variables** at the same location:

**Organization → Settings → Secrets and variables → Actions → Variables**

```yaml
${{ vars.ORG_NAME }}
${{ vars.DEFAULT_REGION }}
${{ vars.SLACK_CHANNEL }}
```

Variables are **not masked** in logs. Use them for non-sensitive configuration that's shared across repos — deployment URLs, feature flags, Slack channel names.

---

## Managing secrets at scale

### For an org with 100+ repos

1. **Use org-level secrets** with "Selected repositories" for shared credentials (registry tokens, cloud access keys)
2. **Use repo-level secrets** for repo-specific values (database URLs, deploy targets)
3. **Use environments** for production credentials with protection rules
4. **Use OIDC** instead of long-lived cloud credentials when possible (see [OIDC & cloud provider auth](oidc.md))

### Auditing

Check which repos have access to an org secret:

```bash
gh api orgs/my-org/actions/secrets/SECRET_NAME/repositories
```

List all org secrets:

```bash
gh api orgs/my-org/actions/secrets
```

---

## Enterprise-level secrets

For GitHub Enterprise Cloud, secrets can also be set at the **enterprise** level:

**Enterprise → Settings → Secrets and variables → Actions**

Enterprise secrets are available to all organizations in the enterprise. Precedence:

```
Repo-level   (highest)
  ↓
Org-level
  ↓
Enterprise-level   (lowest)
```

---

## Secret naming conventions for orgs

| Type | Convention | Example |
|------|-----------|---------|
| Registry tokens | `<REGISTRY>_TOKEN` | `NPM_TOKEN`, `DOCKERHUB_TOKEN` |
| Cloud credentials | `<PROVIDER>_<KEY_TYPE>` | `AWS_ACCESS_KEY_ID`, `GCP_SA_KEY` |
| Deployment URLs | `<ENV>_URL` | `STAGING_URL`, `PROD_DATABASE_URL` |
| SSH keys | `SSH_KEY_<PURPOSE>` | `SSH_KEY_DEPLOY`, `SSH_KEY_BUILD` |
| API keys | `<SERVICE>_API_KEY` | `SONARCLOUD_API_KEY`, `SLACK_API_KEY` |

Consistent naming makes it obvious what a secret is for and reduces mistakes. A workflow that references `PROD_DATABASE_URL` clearly should not be using a staging database.

[← Back to index](../index.md)
