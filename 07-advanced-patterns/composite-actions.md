# Composite Actions

A composite action packages multiple steps into a single reusable unit. Unlike a reusable workflow, it runs **inside the caller's job** — same runner, same shell, same context. Create one when you find yourself copy-pasting the same set of steps across workflows.

---

## Creating a composite action

### Directory structure

```
my-action/
├── action.yml              ← required — defines the action
└── scripts/
    └── setup.sh
```

### action.yml

```yaml
name: 'Setup and Lint'
description: 'Install dependencies and run linters'
author: 'Your Name'

inputs:
  node-version:
    description: 'Node.js version'
    required: false
    default: '20'
  working-directory:
    description: 'Where to run'
    required: false
    default: '.'

outputs:
  lint-result:
    description: 'Pass or fail'
    value: ${{ steps.lint.outcome }}

runs:
  using: 'composite'
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'npm'

    - run: npm ci
      shell: bash
      working-directory: ${{ inputs.working-directory }}

    - id: lint
      run: npm run lint
      shell: bash
      working-directory: ${{ inputs.working-directory }}
```

The key difference from a workflow: `runs: using: 'composite'` and every `run:` step must specify `shell:`.

---

## Using a composite action

### Same repo

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: ./.github/actions/setup-lint
    with:
      node-version: '22'
```

### External repo

```yaml
steps:
  - uses: my-org/shared-actions/setup-lint@v1
    with:
      node-version: '22'
```

---

## Inputs and outputs

Composite actions support the same input types as workflows:

```yaml
inputs:
  environment:
    description: 'Target environment'
    required: true
  dry-run:
    description: 'Skip deployment'
    required: false
    default: 'false'
  timeout:
    description: 'Max duration in seconds'
    required: false
    default: '300'
```

Outputs can reference step outputs or use literal values:

```yaml
outputs:
  version:
    description: 'Built version'
    value: ${{ steps.build.outputs.version }}
  status:
    description: 'Build status'
    value: ${{ steps.build.outcome }}
```

Usage by the caller:

```yaml
steps:
  - id: my-step
    uses: ./.github/actions/build
    with:
      environment: production
  - run: echo "Built ${{ steps.my-step.outputs.version }}"
```

---

## Calling other actions from a composite

A composite action can use any action:

```yaml
runs:
  using: 'composite'
  steps:
    - uses: actions/checkout@v4

    - uses: actions/cache@v4
      with:
        path: ~/.npm
        key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}

    - run: npm ci
      shell: bash
```

But it **cannot** call reusable workflows or have its own `jobs:`.

---

## `shell:` is mandatory for `run:` steps

Every `run:` step in a composite action must specify `shell:`:

```yaml
# Correct
- run: echo "hello"
  shell: bash

# WRONG — will fail validation
- run: echo "hello"
```

Supported shells: `bash`, `pwsh`, `python {0}`, `node {0}`, `cmd`, `powershell`.

---

## Environment variables in composite actions

Composite actions inherit the caller's `env`. They can also set step-level `env`:

```yaml
runs:
  using: 'composite'
  steps:
    - run: echo $MY_VAR
      shell: bash
      env:
        MY_VAR: set-inside-composite
```

---

## Conditional steps in composite actions

```yaml
runs:
  using: 'composite'
  steps:
    - run: npm run build
      shell: bash
      if: inputs.environment == 'production'

    - run: echo "Skipping build"
      shell: bash
      if: inputs.environment != 'production'
```

The `if` evaluates in the context of the composite action. You can reference `inputs.*` and all standard contexts (`github.*`, `env.*`, etc.), but **not** `secrets.*` — those are inherited automatically by the caller's job.

---

## Complete example: deploy action

```yaml
# .github/actions/deploy/action.yml
name: 'Deploy to Environment'
description: 'Build, test, and deploy to a target environment'

inputs:
  environment:
    description: 'staging or production'
    required: true
  app-name:
    description: 'Application name'
    required: true
  image-tag:
    description: 'Docker image tag'
    required: false
    default: ${{ github.sha }}

outputs:
  url:
    description: 'Deployment URL'
    value: ${{ steps.deploy.outputs.url }}

runs:
  using: 'composite'
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - run: npm ci
      shell: bash

    - run: npm run build
      shell: bash

    - run: npm test
      shell: bash

    - id: build
      uses: docker/build-push-action@v6
      with:
        push: true
        tags: ${{ inputs.app-name }}:${{ inputs.image-tag }}

    - id: deploy
      run: |
        echo "Deploying to ${{ inputs.environment }}..."
        echo "url=https://${{ inputs.environment }}.example.com/${{ inputs.app-name }}" >> $GITHUB_OUTPUT
      shell: bash
```

---

## Composite action vs reusable workflow vs custom action

| | Composite Action | Reusable Workflow | JavaScript/Docker Action |
|---|---|---|---|
| Runs | Inside caller's job | Separate job, own runner | Inside caller's job |
| Language | YAML steps only | YAML jobs + steps | JavaScript or Docker |
| Complexity | Low | Medium | High |
| `secrets` access | Automatic (inherits) | Explicit (must pass) | Automatic (inherits) |
| Can use matrix | No | Yes | No |
| Can set `runs-on` | No | Yes | No |
| Best for | Shared step sequences | Shared job patterns | Custom logic needing code |

Use a **composite action** when you have 5+ identical steps across workflows. Use a **reusable workflow** when you need a separate runner, matrix, or environment. Use a **JavaScript/Docker action** when you need actual code (API calls, file manipulation, complex logic).

[← Back to index](../index.md)
