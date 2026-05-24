# Service Containers Example

Node.js Express API tested against a real PostgreSQL database running as a GitHub Actions service container.

## What this workflow does

1. Runs `lint` — ESLint checks
2. Spins up a **PostgreSQL 16** service container
3. Waits for the database to be healthy (`pg_isready`)
4. Runs integration tests that read/write real data
5. Tears down the container when the job finishes

## How it works

The `services:` block in the workflow starts a Postgres container alongside the job. The job connects to it at `localhost:5432` using the credentials from `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`:

```
┌─────────────────────────────────────┐
│  GitHub Actions Runner (Ubuntu)     │
│                                     │
│  ┌──────────┐    ┌───────────────┐  │
│  │ Job: test│    │ Service:      │  │
│  │ npm test │───▶│ postgres:16   │  │
│  │          │    │ port 5432     │  │
│  └──────────┘    └───────────────┘  │
│       localhost:5432                │
└─────────────────────────────────────┘
```

## Running locally

```bash
# Start a local Postgres
docker run -d --name pg-test \
  -e POSTGRES_USER=testuser \
  -e POSTGRES_PASSWORD=testpass \
  -e POSTGRES_DB=testdb \
  -p 5432:5432 postgres:16

# Run the app and tests
npm install
npm test

# Clean up
docker rm -f pg-test
```

## What this demonstrates

| Concept | Where to look |
|---------|--------------|
| `services:` block with PostgreSQL | `ci.yml` lines 29-42 |
| Health check (`--health-cmd pg_isready`) | `ci.yml` line 41 |
| Database credentials via env vars | `ci.yml` lines 57-60 |
| `initDb()` → create tables before tests | `db.js` |
| `beforeEach` → clean slate per test | `index.test.js` |
| `afterAll` → close pool | `index.test.js` |

## Key takeaway

Service containers let you run **real integration tests** in CI without mocking the database. The container starts fresh for every job and is destroyed when the job finishes — no state leaks between runs.

## Next steps

- [Node.js CI](../nodejs-app/) — basic CI without databases
- [Composite Action](../composite-action/) — packaging steps into reusable actions
- [Reusable Workflow](../reusable-workflow/) — sharing entire jobs across repos
