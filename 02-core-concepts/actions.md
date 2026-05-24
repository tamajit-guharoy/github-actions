# Actions

An **action** is a reusable unit of code that you can use as a step in your workflow. Think of them as functions you call from your workflow YAML.

## Three types of actions

### JavaScript actions

Runs Node.js directly on the runner. Fast startup, best for interacting with the GitHub API.

```yaml
- uses: actions/github-script@v7
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: 'Deploy complete!'
      })
```

### Docker container actions

Packs the environment and logic into a Docker image. Slower startup, but consistent and portable.

```yaml
- uses: docker://gcr.io/cloud-builders/gcloud
  with:
    args: app deploy
```

### Composite actions

Combine multiple steps into a single action using only YAML — no code required.

```yaml
# action.yml
name: 'Setup and Test'
runs:
  using: 'composite'
  steps:
    - run: npm ci
      shell: bash
    - run: npm test
      shell: bash
```

## Using an action

Actions are referenced by `owner/repo@ref`:

```yaml
- uses: actions/checkout@v4     # official — actions/ org
- uses: docker/login-action@v3   # Docker team
- uses: ./.github/actions/my-action  # local action in same repo
```

Pin to a **tag or SHA** for stability. `@main` or `@master` can break your workflow unexpectedly.

## Inputs and outputs

```yaml
- uses: actions/setup-node@v4
  with:                          # inputs
    node-version: 20
```

Actions can return outputs that later steps can reference:

```yaml
- id: meta
  uses: docker/metadata-action@v5
  with:
    images: myusername/my-app
- run: echo "Tags: ${{ steps.meta.outputs.tags }}"
```

See real action usage: [examples/docker-app/.github/workflows/docker-build-push.yml](../examples/docker-app/.github/workflows/docker-build-push.yml)

---

[← Back to index](../index.md)
