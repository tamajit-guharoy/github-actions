# Reusable Workflow Example

Demonstrates how to create and call **reusable workflows** — entire jobs that other workflows can invoke, each on their own runner.

## Structure

```
.
├── .github/workflows/
│   ├── _build.yml           ← Reusable workflow (on: workflow_call)
│   └── ci.yml               ← Caller (uses: ./.github/workflows/_build.yml)
├── package.json
├── index.js
├── index.test.js
└── README.md
```

## How it works

```
ci.yml (caller)
   │
   ├── uses: _build.yml (defaults: Node 20, lint on)
   │         → Separate job on its own ubuntu-latest runner
   │
   ├── uses: _build.yml (with: node-version: 22)
   │         → Another separate job — different Node version
   │
   ├── uses: _build.yml (with: run-lint: false)
   │         → Skips linting entirely
   │
   └── uses: _build.yml (secrets: NPM_TOKEN)
             → Passes a secret for private registry access
```

Each `uses:` creates a **separate job on a fresh runner**. They can run in parallel with different inputs, different secrets, and different configurations.

## Key concepts

| Concept | Where to look |
|---------|--------------|
| `on: workflow_call` trigger | `_build.yml` line 16 |
| Declaring inputs with types/defaults | `_build.yml` lines 17-24 |
| Declaring required secrets | `_build.yml` lines 25-27 |
| Declaring outputs from jobs | `_build.yml` lines 28-30 |
| Calling the workflow with `uses:` | `ci.yml` lines 25-57 |
| Passing secrets explicitly | `ci.yml` lines 52-53 |
| Consuming outputs via `needs` | `ci.yml` lines 59-67 |

## Reusable workflow vs composite action

| | Reusable Workflow | Composite Action |
|---|---|---|
| Runs in | Separate job, own runner | Inside the caller's job |
| Has `runs-on:` | Yes | No |
| Has `env:`, `permissions:` | Yes | No |
| Can call other workflows | Yes | No |
| Secrets | Explicit (must be passed) | Inherited from caller |
| Best for | Cross-repo logic, separate runners | Shared steps within a job |

## Calling from another repository

To call this workflow from a different repo (real production use case):

```yaml
jobs:
  build:
    uses: my-org/reusable-workflow/.github/workflows/_build.yml@v1
    with:
      node-version: '20'
    secrets:
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Pinning to `@v1` (a tag) ensures stability. See the [versioning documentation](../../09-custom-actions/versioning.md) for details.
