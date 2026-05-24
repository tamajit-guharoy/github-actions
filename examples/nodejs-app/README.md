# Node.js CI Demo

A simple Express.js API with a working GitHub Actions CI workflow.

## What the workflow does

1. **Lint** — ESLint checks code quality on every push/PR to `main`
2. **Test** — Jest runs tests on Node.js 18, 20, and 22 (matrix strategy)
3. **Coverage** — uploads the coverage report as an artifact

## Run locally

```
npm ci
npm test
npm run lint
npm start
```

## Workflow file

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

## Key concepts demonstrated

- `actions/checkout@v4` for checking out code
- `actions/setup-node@v4` with `cache: 'npm'` for fast Node.js setup
- `strategy.matrix` to test across multiple Node versions
- `needs: lint` for sequential job execution
- `actions/upload-artifact@v4` to persist test output

[← Back to index](../../index.md)
