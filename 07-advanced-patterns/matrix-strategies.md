# Matrix Strategies

A matrix strategy runs the same job across multiple configurations in parallel. Every combination of the listed variables becomes its own job runner. This is how you test against 3 OSes × 4 language versions = 12 jobs without writing 12 copies of the YAML.

---

## Basic matrix

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm test
```

This generates 3 × 2 = 6 jobs:

```
(ubuntu-latest, 18)   (ubuntu-latest, 20)   (ubuntu-latest, 22)
(windows-latest, 18)  (windows-latest, 20)  (windows-latest, 22)
```

Each combination is a separate runner with its own `${{ matrix.* }}` context.

---

## `fail-fast` — stop all on first failure

```yaml
strategy:
  fail-fast: true             # default: true — cancel all others when one fails
  matrix:
    node-version: [18, 20, 22]
```

Set to `false` when you want complete results even if one leg fails — e.g., you want to see which specific versions are broken:

```yaml
strategy:
  fail-fast: false
  matrix:
    node-version: [18, 20, 22]
```

---

## `max-parallel` — limit concurrent jobs

```yaml
strategy:
  max-parallel: 4             # run at most 4 jobs at once
  matrix:
    node-version: [18, 20, 22]
    os: [ubuntu-latest, windows-latest, macos-latest]
```

Without `max-parallel`, all 9 legs would start immediately (subject to account concurrency limits). The 5th job queues until one of the first 4 finishes. Use this when downstream systems (databases, APIs) can't handle the full blast of simultaneous connections.

---

## `include` — add extra combinations

```yaml
strategy:
  matrix:
    node-version: [18, 20]
    os: [ubuntu-latest]
  include:
    - node-version: 22
      os: ubuntu-latest
    - node-version: 20
      os: windows-latest
```

The base matrix generates 2 × 1 = 2 jobs. `include` adds 2 more (total: 4). Each `include` entry must be a superset of the matrix variables — you can add **extra variables** that don't exist in the main matrix:

```yaml
matrix:
  node-version: [18, 20]
include:
  - node-version: 20
    experimental: true          # extra variable — only available in this leg
```

---

## `exclude` — remove combinations

```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
    os: [ubuntu-latest, windows-latest]
  exclude:
    - node-version: 18
      os: windows-latest       # Node 18 on Windows is flaky — skip it
    - node-version: 22
      os: windows-latest       # Node 22 on Windows doesn't compile yet
```

Exclude runs after the matrix is generated. The matcher requires exact match on all listed keys.

---

## Using the matrix in job names

```yaml
jobs:
  test:
    name: Test Node ${{ matrix.node-version }} on ${{ matrix.os }}
    strategy:
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, windows-latest]
```

Without a custom `name:`, the job appears as `test (18, ubuntu-latest)`. A custom name makes the Actions UI much more readable: `Test Node 18 on ubuntu-latest`.

---

## Matrix with multiple variables of different types

```yaml
strategy:
  matrix:
    python-version: ["3.10", "3.11", "3.12", "3.13"]
    db: [postgres, mysql]
    experimental: [false]
    include:
      - python-version: "3.14-dev"
        db: postgres
        experimental: true
    exclude:
      - python-version: "3.10"
        db: mysql               # Python 3.10 dropped MySQL driver support
```

---

## Conditional matrix values (via `include` only)

There's no `if` at the matrix level. To conditionally add entries, use a JSON strategy:

```yaml
jobs:
  generate-matrix:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - id: set-matrix
        run: |
          if [ "${{ github.event_name }}" = "schedule" ]; then
            echo 'matrix={"node-version":[18,20,22],"os":["ubuntu-latest","windows-latest","macos-latest"]}' >> $GITHUB_OUTPUT
          else
            echo 'matrix={"node-version":[20],"os":["ubuntu-latest"]}' >> $GITHUB_OUTPUT
          fi

  test:
    needs: generate-matrix
    strategy:
      matrix: ${{ fromJSON(needs.generate-matrix.outputs.matrix) }}
    runs-on: ${{ matrix.os }}
    steps:
      - run: npm test
```

This pattern gives you dynamic control — full CI matrix on scheduled runs, minimal on PRs.

---

## Matrix across environments

```yaml
strategy:
  matrix:
    environment: [staging, production]
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ matrix.environment }}
    steps:
      - run: ./deploy.sh
```

Each environment's protection rules fire independently for its matrix leg. Production might pause for reviewer approval while staging deploys immediately.

---

## Complete example

```yaml
jobs:
  test:
    name: "Node ${{ matrix.node-version }} — ${{ matrix.os }}"
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      max-parallel: 6
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, windows-latest]
        include:
          - node-version: 20
            os: macos-latest
          - node-version: 22
            os: macos-latest
            experimental: true
        exclude:
          - node-version: 18
            os: windows-latest
    continue-on-error: ${{ matrix.experimental == true }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm test
```

See working matrix strategies in the example apps:
- [Node.js CI](../examples/nodejs-app/.github/workflows/ci.yml) — 3 Node versions
- [Python CI](../examples/python-app/.github/workflows/ci.yml) — 4 Python versions
- [Java CI](../examples/java-app/.github/workflows/ci.yml) — 3 Java versions

[← Back to index](../index.md)
