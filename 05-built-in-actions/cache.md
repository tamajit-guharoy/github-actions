# actions/cache

`actions/cache` saves and restores files between workflow runs. It's most commonly used for package dependencies — instead of downloading 500 MB of npm packages every run, you restore them from cache in seconds.

---

## Basic usage

```yaml
steps:
  - uses: actions/checkout@v4

  - uses: actions/cache@v4
    with:
      path: ~/.npm               # directory to cache
      key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}
      restore-keys: |
        ${{ runner.os }}-npm-

  - run: npm ci                  # runs fast — cache restored, only diffs downloaded
```

---

## Cache key design

The `key` is the most important concept. A good key:
1. Includes `runner.os` (caches are not shared across platforms)
2. Includes a hash of the lock file (`hashFiles('package-lock.json')`)
3. Creates a new cache when the lock file changes

```
Linux-npm-b363e7078c              ← hashFiles matched — exact hit
Linux-npm-                          ← fallback via restore-keys — partial hit
```

### Exact hit vs partial hit

- **Exact key match**: Cache is fully restored. Fast.
- **Partial match** (via `restore-keys`): Closest matching cache is restored. Steps may need to install a few extra packages.
- **No match**: Fresh install. Slow, but correct.

---

## Common caching recipes

### Node.js (npm)

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

> **Note:** `setup-node` with `cache: 'npm'` does this automatically. Use this only if you're not using `setup-node` or need custom cache paths.

### Python (pip)

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}
    restore-keys: |
      ${{ runner.os }}-pip-
```

> `setup-python` with `cache: 'pip'` handles this automatically.

### Python (virtualenv — custom path)

```yaml
- uses: actions/cache@v4
  with:
    path: .venv
    key: ${{ runner.os }}-venv-${{ hashFiles('requirements.txt') }}
```

Only use when you have a local `.venv` and aren't using `setup-python`'s built-in cache.

### Java (Maven)

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.m2/repository
    key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}
    restore-keys: |
      ${{ runner.os }}-maven-
```

> `setup-java` with `cache: 'maven'` handles this automatically.

### Java (Gradle)

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.gradle/caches
      ~/.gradle/wrapper
    key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
    restore-keys: |
      ${{ runner.os }}-gradle-
```

### Go modules

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.cache/go-build
      ~/go/pkg/mod
    key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
    restore-keys: |
      ${{ runner.os }}-go-
```

> `setup-go` with `cache: true` handles this automatically.

### Docker layers (BuildKit)

```yaml
- uses: docker/build-push-action@v6
  with:
    cache-from: type=gha          # GitHub Actions cache backend
    cache-to: type=gha,mode=max   # cache all layers
```

Docker uses a separate cache backend (`type=gha`) — not `actions/cache`. See the [Docker example](../examples/docker-app/.github/workflows/docker-build-push.yml).

---

## Cache scoping and eviction

- **Scope**: Caches are scoped to the **branch** that created them. A cache created on `main` is accessible from `feature/x`, but a cache created on `feature/x` is NOT accessible from `main`.
- **Eviction**: GitHub evicts caches that haven't been accessed in **7 days**.
- **Total limit**: 10 GB per repository (combined across all caches). Oldest caches are evicted first when the limit is exceeded.
- **Isolation**: Caches from PRs from forks are **not shared** with the base repo.

---

## Cache management in the UI

View and delete caches at: **repo → Actions → Caches** (in the left sidebar).

Or via the API:

```bash
gh api repos/owner/repo/actions/caches
```

---

## `hashFiles` — the key ingredient

`hashFiles` computes a SHA-256 hash of one or more files. When the files change, the hash changes → new cache key → fresh cache.

```yaml
key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}
key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}        # glob pattern
key: ${{ runner.os }}-all-${{ hashFiles('package-lock.json', 'requirements.txt') }}
```

**Always hash the lock file**, not the source code. Source code changes frequently; lock files only change when dependencies actually change.

---

## Cache vs artifact

| | Cache | Artifact |
|---|-------|----------|
| **Purpose** | Speed up workflow runs | Persist data between jobs or for download |
| **Lifetime** | 7 days unused | 90 days (default) |
| **Access** | Restored by same workflow | Downloaded from Actions UI or API |
| **Sharing** | Across workflow runs (same repo) | Across jobs in same run; downloadable manually |
| **Typical use** | `node_modules`, `.m2`, pip cache | Build outputs, test reports, binaries |

---

## When NOT to cache

- **Build outputs**: Use `upload-artifact` instead. Caches can be evicted at any time.
- **Secrets or credentials**: Caches are stored in GitHub's storage, but treat them as non-secret-encrypted. Only cache public dependencies.
- **Large binaries that change every run**: The cache is created per-key — a new key every run fills up your 10 GB quota fast.

[← Back to index](../index.md)
