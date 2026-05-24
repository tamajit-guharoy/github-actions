# Job Outputs & Dependencies

Jobs are isolated — they run on separate runners with no shared filesystem. Outputs and the `needs` context are the only ways to pass data between them.

---

## Setting step outputs

A step writes key-value pairs to `$GITHUB_OUTPUT`:

```yaml
steps:
  - id: build
    run: |
      echo "version=1.2.3" >> $GITHUB_OUTPUT
      echo "artifact=my-app.tgz" >> $GITHUB_OUTPUT
```

These are available within the **same job** as `${{ steps.build.outputs.version }}`:

```yaml
  - run: echo "Version: ${{ steps.build.outputs.version }}"
```

---

## Passing outputs between jobs

To share outputs across jobs, the producing job declares `outputs:` and the consuming job uses the `needs` context:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.set-version.outputs.version }}   # must reference a step output
      status: ${{ steps.set-version.outcome }}
    steps:
      - id: set-version
        run: echo "version=$(node -p "require('./package.json').version")" >> $GITHUB_OUTPUT

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying version ${{ needs.build.outputs.version }}"
```

Outputs are always **strings**. If you need to pass a number or boolean, the consumer must parse it.

### Outputs cannot reference `secrets`

```yaml
# WRONG — outputs can't contain secrets
outputs:
  token: ${{ secrets.GITHUB_TOKEN }}
```

The runner blocks this. Use `$GITHUB_OUTPUT` and pass to a downstream job's `env:` instead.

---

## Passing complex data with `toJSON` and `fromJSON`

For structured data, serialize to JSON and parse on the other side:

```yaml
jobs:
  generate:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - id: set-matrix
        run: |
          echo 'matrix={"version":["1.0","1.1","1.2"],"os":["linux","windows"]}' >> $GITHUB_OUTPUT

  test:
    needs: generate
    strategy:
      matrix: ${{ fromJSON(needs.generate.outputs.matrix) }}
    runs-on: ${{ matrix.os }}
    steps:
      - run: echo "Testing version ${{ matrix.version }}"
```

---

## `needs` context — more than outputs

The `needs` context provides everything about the upstream job:

```yaml
${{ needs.build.result }}            # 'success', 'failure', 'cancelled', 'skipped'
${{ needs.build.outputs.version }}   # custom outputs
```

### Checking result of an upstream job

```yaml
jobs:
  notify:
    needs: [lint, test, build]
    if: ${{ always() && needs.lint.result == 'success' && needs.test.result == 'success' }}
    runs-on: ubuntu-latest
    steps:
      - run: echo "All checks passed!"
```

`always()` is needed because without it, any upstream failure would skip this job entirely. Then `needs.*.result` lets you check individual job statuses.

### Iterating over all upstream results

```yaml
steps:
  - run: echo '${{ toJSON(needs) }}'
```

This prints all upstream job data — useful for debugging complex pipelines.

---

## Conditional outputs

A job can set different outputs depending on what happened:

```yaml
jobs:
  check:
    runs-on: ubuntu-latest
    outputs:
      deploy: ${{ steps.check.outputs.deploy }}
      skip-reason: ${{ steps.check.outputs.skip-reason }}
    steps:
      - id: check
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            echo "deploy=true" >> $GITHUB_OUTPUT
          else
            echo "deploy=false" >> $GITHUB_OUTPUT
            echo "skip-reason=Not on main branch" >> $GITHUB_OUTPUT
          fi

  deploy:
    needs: check
    if: needs.check.outputs.deploy == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh

  skip-notify:
    needs: check
    if: needs.check.outputs.deploy == 'false'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Skipped: ${{ needs.check.outputs.skip-reason }}"
```

---

## Outputs from matrix jobs

When a job with a matrix produces outputs, only the **last completed** (highest index) leg's outputs are available by default.

To access all matrix outputs, collect them in an aggregate step:

```yaml
jobs:
  test:
    strategy:
      matrix:
        version: [18, 20, 22]
    runs-on: ubuntu-latest
    steps:
      - id: run-test
        run: |
          npm test
          echo "result=passed" >> $GITHUB_OUTPUT

  collect:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: |
          echo '${{ toJSON(needs.test) }}'
          # shows all matrix leg results
```

To pass individual matrix leg outputs, use `upload-artifact` + `download-artifact` with merge, or a job that aggregates the data.

---

## Common patterns

### Build once, deploy many

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      artifact-name: ${{ steps.upload.outputs.artifact-name }}
    steps:
      - run: npm run build
      - id: upload
        uses: actions/upload-artifact@v4
        with:
          name: dist-${{ github.sha }}
          path: dist/

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist-${{ github.sha }}
      - run: ./deploy.sh

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist-${{ github.sha }}
      - run: ./deploy.sh
```

### Dynamic matrix from a previous job

```yaml
jobs:
  discover:
    runs-on: ubuntu-latest
    outputs:
      projects: ${{ steps.discover.outputs.projects }}
    steps:
      - id: discover
        run: |
          # Find all directories with a package.json
          dirs=$(find . -name package.json -not -path '*/node_modules/*' -exec dirname {} \; | jq -R -s -c 'split("\n")[:-1]')
          echo "projects=$dirs" >> $GITHUB_OUTPUT

  test:
    needs: discover
    strategy:
      matrix:
        project: ${{ fromJSON(needs.discover.outputs.projects) }}
    runs-on: ubuntu-latest
    steps:
      - run: npm ci
        working-directory: ${{ matrix.project }}
      - run: npm test
        working-directory: ${{ matrix.project }}
```

This tests every project in a monorepo without hardcoding the list.

[← Back to index](../index.md)
