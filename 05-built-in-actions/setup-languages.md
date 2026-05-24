# Setup Actions (setup-node, setup-python, setup-java, etc.)

The `setup-*` family of actions installs language runtimes and package managers onto the runner. They handle version resolution, caching, and PATH configuration — so `node`, `python`, `java`, etc. are immediately available in subsequent steps.

All official setup actions are maintained under [github.com/actions](https://github.com/actions).

---

## Common pattern across all setup actions

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-<LANG>@v5
    with:
      <lang>-version: "<version>"
      cache: "<package-manager>"
  - run: <install dependencies>
  - run: <run tests>
```

---

## setup-node

Installs Node.js and npm.

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20            # or "20.x", "20.11.0", "lts/*", "latest"
    cache: 'npm'                # caches ~/.npm (use 'yarn' or 'pnpm' for those)
```

### Auth with npm registry

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    registry-url: 'https://registry.npmjs.org'
- run: npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Matrix strategy

```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
      cache: 'npm'
```

---

## setup-python

```yaml
- uses: actions/setup-python@v5
  with:
    python-version: "3.12"       # or "3.x", "pypy3.10"
    cache: 'pip'                 # caches ~/.cache/pip
```

### Multiple Python versions in a matrix

```yaml
strategy:
  matrix:
    python-version: ["3.10", "3.11", "3.12", "3.13"]
steps:
  - uses: actions/setup-python@v5
    with:
      python-version: ${{ matrix.python-version }}
      cache: 'pip'
```

### Using pipenv or poetry

```yaml
- uses: actions/setup-python@v5
  with:
    python-version: "3.12"
    cache: 'pipenv'             # caches pipenv's virtualenv
```

```yaml
- uses: actions/setup-python@v5
  with:
    python-version: "3.12"
    cache: 'poetry'             # caches poetry's virtualenv
```

---

## setup-java

```yaml
- uses: actions/setup-java@v4
  with:
    java-version: "21"
    distribution: "temurin"     # Eclipse Adoptium (recommended free distribution)
    cache: 'maven'              # or 'gradle', 'sbt'
```

### Distribution options

| Value | Distribution |
|-------|-------------|
| `temurin` | Eclipse Adoptium (open-source, widely used) |
| `zulu` | Azul Zulu (good for macOS ARM64) |
| `corretto` | Amazon Corretto (AWS default) |
| `microsoft` | Microsoft Build of OpenJDK |
| `oracle` | Oracle JDK (commercial license for older versions) |

### Maven with settings.xml

```yaml
- uses: actions/setup-java@v4
  with:
    java-version: "21"
    distribution: "temurin"
    cache: 'maven'
    maven-settings: ${{ secrets.MAVEN_SETTINGS }}  # base64-encoded settings.xml for private repos
```

### Gradle

```yaml
- uses: actions/setup-java@v4
  with:
    java-version: "21"
    distribution: "temurin"
    cache: 'gradle'
- run: ./gradlew build
```

---

## setup-go

```yaml
- uses: actions/setup-go@v5
  with:
    go-version: "1.22"          # or ">=1.21.0", "1.22.x"
    cache: true                 # auto-caches go modules and build cache
```

### Go version matrix

```yaml
strategy:
  matrix:
    go-version: ["1.21", "1.22", "1.23"]
steps:
  - uses: actions/setup-go@v5
    with:
      go-version: ${{ matrix.go-version }}
      cache: true
  - run: go test ./...
```

---

## setup-dotnet

```yaml
- uses: actions/setup-dotnet@v4
  with:
    dotnet-version: "8.0.x"
```

### Multiple .NET versions

```yaml
- uses: actions/setup-dotnet@v4
  with:
    dotnet-version: |
      6.0.x
      8.0.x
```

---

## Cache behavior

All `setup-*` actions support built-in caching. When you pass `cache: 'npm'` (or `pip`, `maven`, etc.), the action automatically:

1. Computes a cache key from your lock file (`package-lock.json`, `requirements.txt`, `pom.xml`)
2. Restores cached dependencies if the key matches
3. Saves updated cache after the job succeeds

```yaml
# Without cache
- uses: actions/setup-node@v4
  with:
    node-version: 20

# With cache — identical otherwise, but runs ~50-80% faster after first run
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'
```

When you need **custom cache paths** (e.g., caching `.venv` for Python), use `actions/cache` directly instead of the built-in `cache:` parameter.

---

## Version resolution

Each setup action resolves version strings flexibly:

| Input | Resolves to |
|-------|-------------|
| `"20"` | Latest 20.x |
| `"20.11.0"` | Exact version |
| `"20.x"` | Latest 20.x |
| `"lts/*"` | Latest LTS (Node.js) |
| `"latest"` | Latest available |
| `"3.12"` | Latest 3.12.x (Python) |
| `">=1.21.0"` | Latest ≥ 1.21.0 (Go) |

Pinning to a major or minor version (e.g., `"20"` or `"3.12"`) gives you patch updates automatically. Pin to an exact version only if you need strict reproducibility.

---

## Preinstalled software

Many languages come **preinstalled** on GitHub-hosted runners. You can skip `setup-*` and use the preinstalled version — but you lose caching and explicit version control:

```yaml
steps:
  - uses: actions/checkout@v4
  - run: node --version           # preinstalled, but version may change
  - run: npm ci && npm test
```

**Always use `setup-*`** unless you're running a trivial command. It costs ~2 seconds and guarantees the version you expect.

---

## Real examples from the tutorial

- [Node.js CI](../examples/nodejs-app/.github/workflows/ci.yml) — `setup-node@v4` with `cache: 'npm'`, matrix across 18/20/22
- [Python CI](../examples/python-app/.github/workflows/ci.yml) — `setup-python@v5` with `cache: 'pip'`, matrix across 3.10–3.13
- [Java CI](../examples/java-app/.github/workflows/ci.yml) — `setup-java@v4` with `cache: 'maven'`, matrix across 17/21/23

[← Back to index](../index.md)
