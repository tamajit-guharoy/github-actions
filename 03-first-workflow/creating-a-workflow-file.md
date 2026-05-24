# Creating a Workflow File

Workflow files live in a special directory at the root of your repository: `.github/workflows/`. GitHub scans this directory and automatically registers every `.yml` or `.yaml` file it finds as a workflow.

## Directory structure

```
your-repo/
├── .github/
│   └── workflows/
│       ├── ci.yml              ← your first workflow
│       └── deploy.yml           ← another workflow
├── src/
├── package.json
└── ...
```

## Creating the directory

The `.github/workflows/` directory can be created directly in your repo, or in any subdirectory of a monorepo. For example, if you have a monorepo with separate frontend and backend projects:

```
monorepo/
├── frontend/
│   └── .github/workflows/ci.yml
├── backend/
│   └── .github/workflows/ci.yml
```

A workflow file in a subdirectory only responds to events that affect files **in the same directory tree**.

## File naming rules

- Must have a `.yml` or `.yaml` extension
- Must be inside `.github/workflows/` (or a subdirectory thereof)
- Names are for your reference only — they don't affect behavior
- Use descriptive names: `ci.yml`, `deploy.yml`, `nightly-build.yml`

## Minimal workflow file

Every workflow file needs at minimum a `name`, a trigger (`on`), and at least one job with steps. Here is the smallest possible working workflow:

```yaml
name: Hello World                # optional but recommended

on: push                         # trigger: runs on every git push

jobs:
  greet:                         # job id (must be unique within the file)
    runs-on: ubuntu-latest       # the virtual machine to use
    steps:
      - run: echo "Hello, world!"
```

## Taking it further

A more realistic first workflow checks out your code and runs a command:

```yaml
name: My First CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4     # clone the repo
      - run: echo "Build starting..."
      - run: echo "Build complete."
```

Once you commit and push this file to GitHub, the workflow appears in the **Actions** tab of your repository and runs automatically.

## Where to go from here

- Try the [hello-world example](../examples/hello-world/) — copy this into your own repo to see a workflow run
- Read the [workflow syntax overview](workflow-syntax.md) to understand the YAML structure in detail
- [Running your first workflow](running-your-first-workflow.md) explains exactly what happens when you push

[← Back to index](../index.md)
