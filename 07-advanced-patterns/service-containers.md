# Service Containers

Service containers run alongside your job to provide databases, caches, message queues, or any other service your tests need. They're Docker containers that start before your job and stop when it finishes.

---

## Basic service container

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - run: npm test
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/testdb
```

The container is reachable at `localhost:<mapped-port>`. GitHub creates a Docker network automatically, so the job and service containers can resolve each other.

---

## Health checks

By default, the job starts as soon as the service container starts — which may be before the database accepts connections. Add a `--health-cmd` to wait until the service is ready:

```yaml
services:
  postgres:
    image: postgres:16
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

The job waits for the health check to pass before running steps. If the health check fails after all retries, the job fails.

### Health checks for common images

**PostgreSQL**
```
--health-cmd pg_isready
--health-interval 10s
--health-timeout 5s
--health-retries 5
```

**MySQL**
```
--health-cmd "mysqladmin ping -h localhost"
--health-interval 10s
--health-timeout 5s
--health-retries 5
```

**Redis**
```
--health-cmd "redis-cli ping"
--health-interval 10s
--health-timeout 5s
--health-retries 5
```

**Elasticsearch**
```
--health-cmd "curl -s http://localhost:9200/_cluster/health | grep -q 'green\|yellow'"
--health-interval 30s
--health-timeout 10s
--health-retries 10
```

**RabbitMQ**
```
--health-cmd "rabbitmq-diagnostics -q ping"
--health-interval 10s
--health-timeout 5s
--health-retries 5
```

---

## Multiple services

```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_PASSWORD: test
    ports:
      - 5432:5432
    options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

  redis:
    image: redis:7
    ports:
      - 6379:6379
    options: --health-cmd "redis-cli ping" --health-interval 10s --health-timeout 5s --health-retries 5

  localstack:
    image: localstack/localstack:latest
    ports:
      - 4566:4566
    env:
      SERVICES: s3,dynamodb
```

All services start in parallel. The job waits for each one's health check to pass.

---

## Port mapping

```yaml
ports:
  - 5432:5432             # host:container — expose on localhost
  - 8080                  # random host port → container port 8080
```

Services are always accessed via `localhost`. The container port is what the service listens on inside the container. The host port is what your steps connect to.

---

## Credentials and secrets

Service container env vars come from job-level values:

```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_PASSWORD: ${{ secrets.DB_PASSWORD }}    # from repo secrets
      POSTGRES_DB: testdb

  # The steps reference the same password
steps:
  - run: npm test
    env:
      DATABASE_URL: postgres://postgres:${{ secrets.DB_PASSWORD }}@localhost:5432/testdb
```

---

## Custom service images

Use your own Dockerfile as a service:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mock-api:
        image: ghcr.io/my-org/mock-api:v1
        credentials:
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
        ports:
          - 8080:8080
```

---

## Volumes and data directories

```yaml
services:
  postgres:
    image: postgres:16
    volumes:
      - ${{ github.workspace }}/db/init.sql:/docker-entrypoint-initdb.d/init.sql
      - pgdata:/var/lib/postgresql/data
```

Named volumes (`pgdata`) persist within the job. Bind mounts (`${{ github.workspace }}/db/...`) map files from the checkout. The `docker-entrypoint-initdb.d` folder is a Postgres convention — any `.sql` file placed there runs on first startup.

---

## Service containers vs `container:` vs `docker run`

| | `services:` | `container:` | `docker run` in steps |
|---|---|---|---|
| When it starts | Before job steps | Job runs inside it | During a step |
| Networking | Auto-Docker network | Job is inside the container | Manual networking |
| Health checks | Yes | No (manual wait) | No (manual wait) |
| Cleanup | Automatic | Automatic | Manual |
| Best for | Sidecar services (DBs, caches) | Running the job in a specific OS/package set | One-off service starts |

---

## Full example: integration tests with PostgreSQL

```yaml
name: Integration Tests

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: ${{ secrets.DB_PASSWORD }}
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgres://testuser:${{ secrets.DB_PASSWORD }}@localhost:5432/testdb

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgres://testuser:${{ secrets.DB_PASSWORD }}@localhost:5432/testdb
```

---

## Debugging service containers

```yaml
steps:
  - run: docker ps                         # list running containers
  - run: docker logs $(docker ps -q --filter ancestor=postgres:16)   # service logs
  - run: nc -zv localhost 5432             # test TCP connectivity
  - run: docker inspect $(docker ps -q)    # full container details
```

[← Back to index](../index.md)
