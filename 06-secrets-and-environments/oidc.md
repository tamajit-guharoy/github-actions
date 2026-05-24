# OIDC & Cloud Provider Auth

OpenID Connect (OIDC) lets your workflows authenticate to cloud providers **without storing long-lived credentials as secrets**. Instead of pasting an AWS access key into GitHub, your workflow requests a short-lived token that the cloud provider trusts.

---

## Why OIDC instead of secrets?

| Approach | Risk |
|----------|------|
| Long-lived credentials in secrets | If leaked, valid until manually revoked. Anyone with the secret has full access. |
| OIDC tokens | Valid for the duration of the job only. No secret to steal or rotate. |

With OIDC, you configure a **trust relationship** once between GitHub and your cloud provider. After that, workflows get short-lived tokens automatically — no secrets required.

---

## How OIDC works

```
1. Workflow starts with permissions → id-token: write
2. Runner contacts GitHub's OIDC provider: "I'm workflow X in repo Y on branch main"
3. GitHub signs a JWT asserting the workflow's identity
4. Runner exchanges the JWT for a cloud access token
5. Runner uses the cloud access token (short-lived) to deploy/manage resources
```

The JWT contains claims about the workflow: repository, branch, environment, actor. Your cloud provider checks these claims against the trust policy you configured before issuing a token.

---

## Setting up OIDC

### Step 1: Grant the `id-token` permission

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write           # required for OIDC
      contents: read
    steps:
      - uses: actions/checkout@v4
      - run: |
          # Get the OIDC token
          echo "$ACTIONS_ID_TOKEN_REQUEST_TOKEN" | \
            gh auth login --with-token
```

### Step 2: Configure the cloud provider

---

## AWS

### Configuring the trust relationship

In AWS IAM, create an **OIDC identity provider** for `https://token.actions.githubusercontent.com` and a role that trusts it:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:sub": "repo:octocat/hello-world:environment:production"
        }
      }
    }
  ]
}
```

### Workflow

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsDeploy
          aws-region: us-east-1

      - run: aws s3 sync ./build/ s3://my-bucket/
```

The `aws-actions/configure-aws-credentials` action handles the JWT exchange automatically.

### Subject claims reference

| Claim | Example |
|-------|---------|
| `repo:owner/repo:*` | All environments and branches |
| `repo:owner/repo:ref:refs/heads/main` | Main branch only |
| `repo:owner/repo:environment:production` | Production environment only |
| `repo:owner/repo:pull_request` | PR runs |
| `repo:owner/repo:ref:refs/tags/v*` | Version tags |

Use the most restrictive claim possible. A production IAM role should require `environment:production` in the subject claim.

---

## GCP (Google Cloud)

### Workload Identity Federation

Create a workload identity pool and provider:

```bash
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

### Workflow

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider
          service_account: github-actions@my-project.iam.gserviceaccount.com

      - run: gcloud run deploy my-service --image gcr.io/my-project/my-image
```

---

## Azure

### Federated credentials

Create a service principal and add federated credentials:

```bash
az ad app create --display-name "GitHub Actions"
az ad sp create --id <app-id>

az ad app federated-credential create \
  --id <app-id> \
  --parameters '{
    "name": "github-actions",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:octocat/hello-world:environment:production",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

### Workflow

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: azure/login@v2
        with:
          client-id: ${{ vars.AZURE_CLIENT_ID }}
          tenant-id: ${{ vars.AZURE_TENANT_ID }}
          subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}

      - run: az webapp deployment source config-zip --resource-group my-group --name my-app --src ./build.zip
```

Note: `client-id`, `tenant-id`, and `subscription-id` are **not secrets** — they're stored in variables (`vars`), not secrets.

---

## Inspecting the OIDC token

To see what claims GitHub includes in the JWT:

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Decode OIDC token
    run: |
      # Request the token from the Actions IdP
      ID_TOKEN=$(curl -s -H "Authorization: Bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
        "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=debug" | jq -r '.value')

      # Decode the JWT payload (middle section)
      echo "$ID_TOKEN" | cut -d. -f2 | base64 -d | jq .
```

Typical claims:

```json
{
  "sub": "repo:octocat/hello-world:environment:production",
  "aud": "debug",
  "iss": "https://token.actions.githubusercontent.com",
  "repository": "octocat/hello-world",
  "repository_owner": "octocat",
  "environment": "production",
  "ref": "refs/heads/main",
  "sha": "abc123...",
  "actor": "octocat",
  "job_workflow_ref": "octocat/hello-world/.github/workflows/deploy.yml@main",
  "exp": 1710000000
}
```

---

## OIDC and environments

The most powerful combination: OIDC trusts an **environment**, and that environment has **protection rules**.

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production              # protection rules applied
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/ProdDeploy
```

The AWS role's trust policy requires `environment:production`. The environment requires reviewer approval. You get:

- No long-lived credentials stored in GitHub
- Reviewer must approve before the token is issued
- Token is valid for the job duration only
- Token is scoped to the production role

---

## OIDC for Docker Hub and other registries

OIDC isn't just for cloud providers. Any service that supports OpenID Connect can use it.

### Docker Hub

```yaml
jobs:
  push:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: docker/login-action@v3
        with:
          username: ${{ vars.DOCKERHUB_USERNAME }}
          # No password/token — OIDC handles authentication
```

Configure the trust in Docker Hub: [docs.docker.com/security/for-developers/access-tokens/gh-actions-oidc](https://docs.docker.com/security/for-developers/access-tokens/gh-actions-oidc/).

---

## Security summary

| Practice | Reason |
|----------|--------|
| Use OIDC over long-lived secrets | Tokens expire; secrets don't |
| Restrict subject claims tightly | `repo:owner/repo:environment:production` not `repo:owner/repo:*` |
| Combine with environment protection | Reviewer approval gates token issuance |
| Never log the OIDC token | It's a credential; treat it like a secret |
| Use `vars` for non-sensitive IDs | Client ID, tenant ID, account ID — not secrets |

[← Back to index](../index.md)
