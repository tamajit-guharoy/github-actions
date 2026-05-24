# Performance Optimization

Faster workflows mean faster feedback, fewer waiting minutes, and lower costs. This page covers practical changes that measurably reduce workflow duration.

---

## The checkout: don't fetch what you don't need

### Default (fastest for most cases)

```yaml
- uses: actions/checkout@v4
  # fetch-depth: 1 is the default — just the triggering commit
```

### Full history (only when needed)

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0               # every commit + all tags
    fetch-tags: true
```

Only use `fetch-depth: 0` when you need `git describe`, `git blame`, or commit history for versioning. A full clone of a large repo can add 30–60 seconds.

### Sparse checkout

```yaml
- uses: actions/checkout@v4
  with:
    sparse-checkout: |
      frontend/
      shared/utils/
    sparse-checkout-cone-mode: false
```

For monorepos where you only need a fraction of the code. Checking out 2 directories instead of 50 saves time proportionally.

---

## Caching: the single biggest speedup

### Use built-in caching from setup actions

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'                # zero-config — just add this line
```

This is faster than a separate `actions/cache` step because:
- It runs concurrently with the Node.js install
- It uses the correct cache paths automatically
- It hashes the right lock file without you specifying it

### Cache Docker layers with GHA cache

```yaml
- uses: docker/build-push-action@v6
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

After the first build, subsequent builds are 50–80% faster. `mode=max` caches intermediate layers, not just the final image.

### Don't cache build outputs

Cache the inputs (dependencies), not the outputs (build artifacts). Dependencies change infrequently; build outputs change every run.

```yaml
# Good — cache dependencies (changes rarely)
path: ~/.npm
key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}

# Not helpful — cache build output (changes every run)
path: dist/
key: ${{ runner.os }}-dist-${{ github.sha }}
```

---

## Job ordering: fail fast, run cheap checks first

```yaml
jobs:
  lint:                    # starts immediately — finishes in 10s
    steps: [...]

  typecheck:               # starts immediately — finishes in 30s
    steps: [...]

  test:                    # waits for lint and typecheck
    needs: [lint, typecheck]   # if either fails, test never starts
    steps: [...]
```

Linting and type-checking cost seconds. Running them before the expensive test matrix saves minutes when they fail. A developer sees `❌ Lint failed` in 10 seconds instead of 3 minutes.

---

## Matrix: limit permutations

### Exclude combinations that don't make sense

```yaml
strategy:
  matrix:
    node: [18, 20, 22]
    os: [ubuntu-latest, windows-latest]
  exclude:
    - node: 18
      os: windows-latest     # not supported — skip it
```

### Control max parallelism

```yaml
strategy:
  max-parallel: 4
  matrix:
    node: [18, 20, 22]
    os: [ubuntu-latest, windows-latest, macos-latest]
```

9 matrix combinations but only 4 run at a time — prevents overwhelming a shared resource (database, API rate limit).

---

## Step-level timeouts

```yaml
steps:
  - run: npm test
    timeout-minutes: 10        # if tests hang, kill the step
```

Without a timeout, a hung step runs for **360 minutes** (the job default). A 10-minute timeout catches infinite loops early and frees the runner.

---

## Use `npm ci` not `npm install`

| Command | Behavior | Speed |
|---------|----------|-------|
| `npm ci` | Reads `package-lock.json`, installs exactly that | Fast, deterministic |
| `npm install` | Resolves dependencies, may update lock file | Slower, non-deterministic |

Same logic applies to other ecosystems:
- **pip**: `pip install -r requirements.txt` (locked to pinned versions)
- **bundler**: `bundle install --deployment`
- **cargo**: `cargo build --locked`

---

## Run only changed jobs

### Path filtering on triggers

```yaml
on:
  push:
    paths:
      - 'src/**'
      - 'package.json'
      - '.github/workflows/ci.yml'
```

A docs-only change doesn't run the test suite.

### Conditional jobs based on changed files

```yaml
jobs:
  check-changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.filter.outputs.frontend }}
      backend: ${{ steps.filter.outputs.backend }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            frontend: 'frontend/**'
            backend: 'backend/**'

  frontend-tests:
    needs: check-changes
    if: needs.check-changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps: [...]

  backend-tests:
    needs: check-changes
    if: needs.check-changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    steps: [...]
```

In a monorepo, this prevents running the backend test suite when only the frontend changed.

---

## Action choice matters

### Prefer official actions

Official actions are maintained, optimized, and widely tested. A random community action might do the same thing but with worse performance.

```yaml
# Preferred — official, fast, maintained
- uses: actions/setup-node@v4

# Avoid — unofficial wrapper that does the same thing
- uses: some-random-user/node-setup-optimized@v1
```

### Composite actions vs reusable workflows for shared steps

Composite actions run **inside the caller's job** — no extra runner. Reusable workflows run in a **separate job** with their own runner. If you're just sharing steps within a job, use a composite action.

---

## Runners: right-size

| You need | Use | Why |
|----------|-----|-----|
| Standard build | `ubuntu-latest` (4-core, 16 GB) | Default — enough for most projects |
| Light build (small project) | 2-core larger runner | Cheaper if 4-core is overkill |
| Heavy build (compiled language) | 8-core larger runner | Parallel compilation (`make -j8`) |
| ARM native build | `ubuntu-24.04-arm64` | No QEMU emulation overhead |

For most projects, `ubuntu-latest` is the sweet spot. Don't use macOS or Windows runners unless you need OS-specific tools — they're slower and cost more minutes (macOS = 10× multiplier, Windows = 2×).

---

## Summary of impact

| Optimization | Typical improvement | Effort |
|-------------|-------------------|--------|
| Built-in action caching (`cache: 'npm'`) | 50–80% faster installs | 1 line |
| GHA Docker cache (`type=gha`) | 50–80% faster builds | 2 lines |
| Lint/typecheck before test matrix | 2–3 min saved on failures | Restructure jobs |
| Path filtering on triggers | Skips irrelevant runs | 3 lines |
| `npm ci` instead of `npm install` | 20–40s per install | Change the command |
| Step timeouts | Prevents 6-hour hangs | 1 line per step |
| Sparse checkout (large monorepo) | 30–90s per checkout | 4 lines |

[← Back to index](../index.md)
