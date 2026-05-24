# Node.js CI

A complete CI pipeline for a Node.js project — lint, test across multiple versions, and upload coverage reports. This page walks through the [Node.js example app](../examples/nodejs-app/) workflow.

---

## The workflow at a glance

```yaml
name: Node.js CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    needs: lint
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-node-${{ matrix.node-version }}
          path: coverage/
```

Full source: [examples/nodejs-app/.github/workflows/ci.yml](../examples/nodejs-app/.github/workflows/ci.yml)

---

## Why this design?

### Lint first, then test

The `lint` job has no `needs` — it starts immediately. The `test` job has `needs: lint` — if linting fails, tests never run. This saves runner minutes and gives faster feedback. A formatting error shouldn't spin up 3 test runners.

### Matrix across LTS versions

Node.js 18, 20, and 22 are the active LTS releases. Testing against all three catches:
- API usage from a version you don't have locally
- Breaking changes in newer versions
- Accidental dependencies on features only in your local version

### `cache: 'npm'` on setup-node

The `cache: 'npm'` parameter tells `setup-node` to automatically cache `~/.npm`. This is simpler than using `actions/cache` directly — no key design needed. After the first run, `npm ci` completes in seconds.

### Coverage artifacts with unique names

```yaml
name: coverage-node-${{ matrix.node-version }}
```

Without `${{ matrix.node-version }}` in the name, each matrix leg would try to upload to the same artifact name and fail (duplicate names within a run).

---

## What the app looks like

The example app is an Express.js server with two endpoints:

```javascript
// index.js
app.get('/', (req, res) => res.json({ message: 'Hello, world!' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
```

Tests use Jest + Supertest:

```javascript
const request = require('supertest');
const app = require('../index');

test('GET / returns 200', async () => {
  const res = await request(app).get('/');
  expect(res.status).toBe(200);
});
```

Linting is ESLint:

```json
// .eslintrc.json
{
  "env": { "node": true, "jest": true },
  "extends": "eslint:recommended"
}
```

---

## Adding to this workflow

### TypeScript build step

```yaml
- run: npm run build
- run: npx tsc --noEmit          # type-check without emitting
```

### Integration tests with a database

```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_PASSWORD: test
    ports:
      - 5432:5432
    options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

steps:
  - run: npm run test:integration
    env:
      DATABASE_URL: postgres://postgres:test@localhost:5432/testdb
```

### Notify on failure

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v2
  with:
    webhook: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Key takeaways

1. **Lint before test** — catch cheap errors before spinning up expensive matrix jobs
2. **`cache: 'npm'`** — built into `setup-node`, zero-config speedup
3. **`needs: lint`** — enforces lint passing before tests begin
4. **Artifact names must be unique per matrix leg**
5. **`npm ci` not `npm install`** — respects the lockfile, faster, deterministic

[← Back to index](../index.md)
