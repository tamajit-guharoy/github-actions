# Docker Build & Push Demo

A multi-stage Docker build with a GitHub Actions workflow that builds and pushes to Docker Hub.

## What the workflow does

1. **Buildx setup** — enables multi-platform builds and caching
2. **Login** — authenticates to Docker Hub using repository secrets
3. **Metadata extraction** — auto-generates tags from branch, tag, and commit SHA
4. **Build & push** — multi-stage build with GitHub Actions cache for faster runs

## Secrets required

Set these in your repo **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | A Docker Hub [access token](https://hub.docker.com/settings/security) |

## Run locally

```
docker build -t my-app .
docker run -p 3000:3000 my-app
```

## Workflow file

See [`.github/workflows/docker-build-push.yml`](.github/workflows/docker-build-push.yml)

## Key concepts demonstrated

- `docker/setup-buildx-action@v3` for BuildKit
- `docker/login-action@v3` with secrets-based auth
- `docker/metadata-action@v5` for automatic tag generation
- `docker/build-push-action@v6` with GHA cache backend
- Multi-stage Dockerfile for smaller production images

[← Back to index](../../index.md)
