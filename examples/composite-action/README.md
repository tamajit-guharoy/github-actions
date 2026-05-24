# Composite Action Example

Demonstrates how to create and use a **composite action** — a reusable set of steps defined in YAML that runs inside the caller's job.

## Structure

```
.
├── .github/
│   ├── actions/
│   │   └── setup-test/
│   │       └── action.yml          ← The composite action (setup → lint → test)
│   └── workflows/
│       └── ci.yml                  ← Calls the composite action 3 different ways
├── package.json
├── index.js
├── index.test.js
└── README.md
```

## What the composite action does

1. Installs Node.js (`actions/setup-node@v4`)
2. Runs `npm ci`
3. Runs `npm run lint` (conditionally — can be skipped via input)
4. Runs `npm test`

## How the caller uses it

```yaml
steps:
  - uses: actions/checkout@v4
  - id: ci
    uses: ./.github/actions/setup-test
    with:
      node-version: '22'
      lint: 'true'
  - run: echo "Tests ${{ steps.ci.outputs.test-result }}"
```

One line replaces ~40 lines of repeated setup steps. The same action is called 3 times in `ci.yml` with different inputs — showing how inputs customize behavior without duplicating YAML.

## Key concepts

| Concept | Where to look |
|---------|--------------|
| `runs: using: 'composite'` | `action.yml` line 36 |
| `shell:` requirement on every `run:` step | `action.yml` lines 43, 49, 55 |
| Inputs with defaults | `action.yml` lines 14-30 |
| Outputs referencing step outcomes | `action.yml` lines 34-35 |
| Conditional steps (`if: inputs.lint == 'true'`) | `action.yml` line 48 |
| Calling from the same repo | `ci.yml` line 30 |
| Referencing outputs (`steps.ci.outputs.test-result`) | `ci.yml` line 34 |

## When to use composite actions vs reusable workflows

- **Composite action**: Same steps inside any job. No extra runner. `uses:` inside a job's `steps:`.
- **Reusable workflow**: Entire job(s) with their own runner. Different `runs-on:`, matrix, environment. `uses:` at the job level.

See the [reusable workflow example](../reusable-workflow/) for the other approach.
