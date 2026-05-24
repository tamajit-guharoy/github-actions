# Artifacts (upload-artifact & download-artifact)

Artifacts persist files between jobs in the same workflow run and make them available for download after the run completes. They're used for build outputs, test reports, logs, and deployment packages.

---

## upload-artifact

Uploads files from the runner to GitHub's storage:

```yaml
steps:
  - run: npm run build
  - uses: actions/upload-artifact@v4
    with:
      name: build-output          # artifact name (unique within the run)
      path: dist/                 # file or directory to upload
```

### Key parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `name` | Yes | Artifact name. Must be unique within the workflow run. |
| `path` | Yes | File, directory, or glob pattern to upload |
| `retention-days` | No | Override the default 90-day retention (max 90) |
| `if-no-files-found` | No | `warn` (default), `error` (fail the step), or `ignore` |
| `compression-level` | No | 0–9 (default 6). 0 = no compression, 9 = maximum |
| `overwrite` | No | `false` (default) or `true` — overwrite an existing artifact with the same name |

### Uploading multiple files/paths

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: reports
    path: |
      coverage/lcov.info
      test-results/junit.xml
      playwright-report/
```

### Uploading everything in a directory

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: dist-files
    path: dist/**
```

### Conditional upload (always upload test results)

```yaml
- run: npm test
- uses: actions/upload-artifact@v4
  if: always()                       # upload even if tests failed
  with:
    name: test-results
    path: junit.xml
```

This is the most important pattern for test artifacts — without `if: always()`, the upload step is skipped when tests fail, and you have no report to debug with.

---

## download-artifact

Downloads an artifact from a **previous job** in the same workflow run:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy:
    needs: build                     # must wait for build to finish
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist                  # download the artifact named "dist"
          path: ./dist                # extract here
      - run: ./deploy.sh ./dist
```

### Downloading all artifacts

```yaml
- uses: actions/download-artifact@v4
  with:
    path: ./all-artifacts            # each artifact goes into its own subdirectory
```

Without `name`, all artifacts from the run are downloaded.

### Downloading from a different workflow run

```yaml
- uses: actions/download-artifact@v4
  with:
    name: dist
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository: owner/repo
    run-id: 1234567890
```

Useful for cross-run workflows (e.g., nightly build → morning deploy).

---

## Matrix builds with artifacts

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - run: npm test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-${{ matrix.node-version }}   # unique per matrix leg
          path: junit.xml
```

Each matrix leg uploads a uniquely named artifact. A downstream job can download all of them:

```yaml
merge:
  needs: test
  runs-on: ubuntu-latest
  steps:
    - uses: actions/download-artifact@v4
      with:
        pattern: test-results-*            # download all matching artifacts
        path: results/
        merge-multiple: true               # merge into a single directory
    - run: ./merge-reports.sh results/
```

---

## Artifact retention

- **Default**: 90 days
- **Override per artifact**: `retention-days` (1–90)
- **Change default**: **Settings → Actions → General → Artifact and log retention**

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: debug-logs
    path: logs/
    retention-days: 7              # only keep debug logs for a week
```

---

## Artifact vs cache

| | Artifact | Cache |
|---|----------|-------|
| Use case | Build outputs, test reports, deployable packages | Dependencies, build caches |
| Lifetime | 90 days (configurable) | 7 days unused |
| Cross-job | Yes (`download-artifact`) | No (only via cache key) |
| UI download | Yes (Actions tab → run → Artifacts) | No |
| Size limit | No per-artifact limit (repo total: none) | 10 GB repo total |
| Recovery | Manual download | Automatic restoration |

Use **artifacts** for things you want to download or pass between jobs. Use **cache** for things that speed up the next run.

---

## Security notes

- Artifacts are stored in GitHub's blob storage and accessible to anyone with read access to the repo
- Artifacts from private repos are private; artifacts from public repos are **publicly downloadable** by anyone with the URL
- Don't put secrets in artifacts
- Artifacts uploaded from a fork's PR are not accessible to the base repo (but base-repo artifacts ARE downloadable by fork PRs)

[← Back to index](../index.md)
