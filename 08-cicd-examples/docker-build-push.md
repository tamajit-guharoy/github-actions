# Docker Build & Push

A complete pipeline for building Docker images and pushing them to Docker Hub — multi-stage builds, BuildKit caching via GitHub Actions cache backend, automatic tag generation from git metadata, and secure authentication via secrets.

Full source: [examples/docker-app/.github/workflows/docker-build-push.yml](../examples/docker-app/.github/workflows/docker-build-push.yml)

---

## The workflow at a glance

```yaml
name: Docker Build & Push

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ secrets.DOCKERHUB_USERNAME }}/my-app
          tags: |
            type=ref,event=branch
            type=ref,event=tag
            type=sha,prefix=

      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## The Dockerfile

A multi-stage build that compiles in one stage and runs in a minimal Alpine image:

```dockerfile
# Stage 1: build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm test
RUN npm prune --production

# Stage 2: run
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/index.js .
USER node
EXPOSE 3000
CMD ["node", "index.js"]
```

The build stage includes dev dependencies for testing. The run stage copies only production deps — the final image is much smaller.

---

## Key components explained

### Buildx for multi-platform and cache

```yaml
- uses: docker/setup-buildx-action@v3
```

Buildx is Docker's next-generation build engine. It enables:
- **BuildKit** — faster, parallel builds with better caching
- **Multi-platform builds** — `linux/amd64` and `linux/arm64` in one command
- **GHA cache backend** — store build layers in GitHub Actions cache

Without buildx, you're using the legacy Docker builder — slower and no GHA cache support.

### Docker Hub authentication

```yaml
- uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

Always use a **Personal Access Token**, not your Docker Hub password. Create one at [hub.docker.com/settings/security](https://hub.docker.com/settings/security) with minimal permissions (`Read & Write` for the specific repository). Tokens can be revoked individually without resetting your account password.

### Metadata action — automatic tag generation

```yaml
- uses: docker/metadata-action@v5
  with:
    images: ${{ secrets.DOCKERHUB_USERNAME }}/my-app
    tags: |
      type=ref,event=branch
      type=ref,event=tag
      type=sha,prefix=
```

This generates tags based on git context:

| Trigger | Generates |
|---------|-----------|
| Push to `main` | `username/my-app:main` |
| Push tag `v1.2.3` | `username/my-app:1.2.3`, `username/my-app:1.2`, `username/my-app:1` |
| Any push | `username/my-app:abc1234` (short SHA) |

It also generates OCI labels (org.opencontainers.image.*) with source repo, commit SHA, and creation date.

### GitHub Actions cache backend

```yaml
cache-from: type=gha          # Restore cache from previous builds
cache-to: type=gha,mode=max   # Save ALL layers to GHA cache
```

- `cache-from: type=gha` — reads the GHA cache before building. If a layer hasn't changed (same `COPY package*.json` → same hash), it's pulled from cache instead of rebuilt.
- `cache-to: type=gha,mode=max` — writes all build layers to the GHA cache. `mode=max` exports every intermediate layer, not just the final image. This means even partial rebuilds are fast.

The GHA cache is scoped to the repository and branch. After the first build, subsequent builds are dramatically faster — often 80%+ cache hit rates.

---

## Adding multi-platform builds

```yaml
- uses: docker/build-push-action@v6
  with:
    platforms: linux/amd64,linux/arm64
    push: true
    tags: ${{ steps.meta.outputs.tags }}
```

This builds for both x86 and ARM. Apple Silicon Macs, AWS Graviton, and Raspberry Pi all use ARM — covering both platforms doubles your reach.

Multi-platform builds take longer (QEMU emulation) and use more cache space. For production images, the extra build time is worth it.

---

## Adding a pull request dry-run

```yaml
on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

jobs:
  build:
    steps:
      - uses: docker/build-push-action@v6
        with:
          push: false                 # build but don't push on PRs
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

Building (but not pushing) on PRs verifies the Dockerfile is valid without publishing anything. The cache is still written — so the main-branch push after merge is fast.

---

## Required secrets

| Secret | Where to get it |
|--------|----------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | [hub.docker.com/settings/security](https://hub.docker.com/settings/security) → New Access Token |

Set these at: **Repo → Settings → Secrets and variables → Actions → New repository secret**

---

## Key takeaways

1. **Buildx is required** for GHA cache backend — `setup-buildx-action@v3` before anything else
2. **Use access tokens, not passwords** — revokable, scopeable, auditable
3. **`docker/metadata-action`** generates tags automatically from git context — no hand-rolled bash
4. **`cache-to: type=gha,mode=max`** — caches every layer, not just final image
5. **Multi-stage builds** produce smaller images and keep dev tools out of production

[← Back to index](../index.md)
