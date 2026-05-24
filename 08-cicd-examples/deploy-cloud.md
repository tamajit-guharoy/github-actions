# Deploy to Cloud Providers

Deploying to AWS, GCP, and Azure using GitHub Actions with OIDC authentication — no long-lived credentials stored in secrets.

---

## The OIDC advantage

Before OIDC, you'd store `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as repo secrets — credentials that never expire and have broad permissions. One leak and an attacker has persistent access.

With OIDC, the cloud provider issues a **short-lived token** (valid for the job duration only) after verifying the workflow's identity. No secrets to rotate, no credentials to leak.

Setup for each provider follows the same pattern:

1. Create an OIDC trust relationship between GitHub and the cloud provider
2. Grant the workflow `permissions: id-token: write`
3. Use the cloud provider's login action with the OIDC token

---

## AWS

### IAM setup

Create an OIDC identity provider in IAM for `https://token.actions.githubusercontent.com`, then create a role with a trust policy:

```json
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
```

### Deploy to S3 (static site)

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsDeploy
          aws-region: us-east-1

      - run: npm ci && npm run build

      - run: aws s3 sync ./dist/ s3://my-bucket --delete
```

### Deploy to ECS

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsDeploy
          aws-region: us-east-1

      - uses: aws-actions/amazon-ecr-login@v2
        id: ecr

      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: ${{ steps.ecr.outputs.registry }}/my-app:${{ github.sha }}

      - run: |
          aws ecs update-service \
            --cluster my-cluster \
            --service my-service \
            --force-new-deployment
```

### Deploy to Lambda

```yaml
- run: npm ci && npm run build
- run: zip -r function.zip dist/ node_modules/
- run: aws lambda update-function-code --function-name my-function --zip-file fileb://function.zip
```

---

## GCP (Google Cloud)

### Workload Identity Federation setup

```bash
# Create a workload identity pool
gcloud iam workload-identity-pools create "github-pool" --location="global"

# Create an OIDC provider in the pool
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Allow the provider to impersonate a service account
gcloud iam service-accounts add-iam-policy-binding \
  github-actions@my-project.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/github-pool/attribute.repository/octocat/hello-world"
```

### Deploy to Cloud Run

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider
          service_account: github-actions@my-project.iam.gserviceaccount.com

      - uses: google-github-actions/setup-gcloud@v2

      - run: gcloud builds submit --tag gcr.io/my-project/my-app:${{ github.sha }}

      - run: |
          gcloud run deploy my-service \
            --image gcr.io/my-project/my-app:${{ github.sha }} \
            --region us-central1 \
            --allow-unauthenticated
```

### Deploy to GKE

```yaml
- uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ...
    service_account: github-actions@my-project.iam.gserviceaccount.com

- uses: google-github-actions/get-gke-credentials@v2
  with:
    cluster_name: my-cluster
    location: us-central1-a

- run: kubectl set image deployment/my-app my-app=gcr.io/my-project/my-app:${{ github.sha }}
```

---

## Azure

### Federated credentials setup

```bash
# Create an app registration
az ad app create --display-name "GitHub Actions"

# Create a service principal
az ad sp create --id <app-id>

# Add federated credentials
az ad app federated-credential create \
  --id <app-id> \
  --parameters '{
    "name": "github-actions-production",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:octocat/hello-world:environment:production",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# Grant the service principal access to your resource group
az role assignment create \
  --assignee <sp-id> \
  --role Contributor \
  --resource-group my-resource-group
```

### Deploy to App Service

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: azure/login@v2
        with:
          client-id: ${{ vars.AZURE_CLIENT_ID }}
          tenant-id: ${{ vars.AZURE_TENANT_ID }}
          subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}

      - run: npm ci && npm run build

      - run: zip -r app.zip . -x ".git/*"

      - uses: azure/webapps-deploy@v3
        with:
          app-name: my-app
          package: app.zip
```

### Deploy to AKS

```yaml
- uses: azure/login@v2
  with:
    client-id: ${{ vars.AZURE_CLIENT_ID }}
    tenant-id: ${{ vars.AZURE_TENANT_ID }}
    subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}

- uses: azure/aks-set-context@v4
  with:
    resource-group: my-resource-group
    cluster-name: my-cluster

- uses: azure/k8s-deploy@v5
  with:
    manifests: kubernetes/deployment.yaml
    images: myregistry.azurecr.io/my-app:${{ github.sha }}
```

---

## Multi-environment deployment

```yaml
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/StagingDeploy

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/ProductionDeploy
```

Each environment maps to a different IAM role with its own permissions. Staging and production can deploy to different AWS accounts entirely — the trust policy on each role restricts which environment can assume it.

---

## Key takeaways

1. **OIDC eliminates long-lived credentials** — set it up once, never rotate a secret again
2. **IAM roles map 1:1 to environments** — staging can't assume the production role
3. **Subject claims are your security boundary** — use `environment:production`, not `repo:*`
4. **Client IDs and tenant IDs go in `vars`, not `secrets`** — they're identifiers, not credentials
5. **Separate AWS accounts per environment** — the IAM role in the staging account has no access to production resources

[← Back to index](../index.md)
