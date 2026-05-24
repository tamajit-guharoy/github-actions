# Java CI Demo

A simple Java calculator (Maven) with a working GitHub Actions CI workflow.

## What the workflow does

1. **Lint** — Checkstyle enforces coding standards on push/PR
2. **Test** — JUnit 5 runs across Java 17, 21, and 23 (matrix strategy)
3. **Artifacts** — surefire XML reports uploaded even on failure

## Run locally

```
mvn test
mvn checkstyle:check
```

## Workflow file

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

## Key concepts demonstrated

- `actions/setup-java@v4` with `distribution: 'temurin'` and `cache: 'maven'`
- `strategy.matrix` across 3 Java LTS versions
- `mvn --batch-mode` for non-interactive CI execution
- `if: always()` to persist test reports on failure

[← Back to index](../../index.md)
