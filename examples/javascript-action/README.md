# JavaScript Action Example — PR File Labeler

A custom JavaScript action that automatically labels pull requests based on which files were changed. Built with `@actions/core` and `@actions/github`.

## Structure

```
.
├── action.yml              ← Action metadata (inputs, outputs, runs: node20)
├── package.json            ← Dependencies + build script (ncc)
├── index.js                ← Action logic (reads files → matches rules → adds labels)
├── dist/                   ← Compiled output (created by 'npm run build')
├── .github/workflows/
│   └── test.yml            ← Self-test workflow (labels its own PRs)
└── README.md
```

## How to use

### 1. Install and build

```bash
npm install
npm run build               # Compiles index.js → dist/index.js using ncc
```

The `dist/index.js` is a self-contained bundle — consumers don't need `node_modules`.

### 2. Add to a workflow

```yaml
on:
  pull_request_target:
    types: [opened, synchronize]

jobs:
  label:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: owner/repo@v1             # Reference the action
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          rules: '{"src/**":"code","docs/**":"documentation","**/*.test.*":"tests"}'
```

### 3. How it works

```
PR opened → action runs → API fetches changed files → matches against rules → adds labels

Example: PR changes src/app.js and docs/readme.md
         → labels "code" and "documentation" are added
```

## Key concepts

| Concept | Where to look |
|---------|--------------|
| `runs: using: 'node20'` | `action.yml` line 32 |
| Reading inputs with `core.getInput()` | `index.js` line 18-19 |
| Accessing workflow context | `index.js` line 12 (`github.context`) |
| Octokit REST API (`pulls.listFiles`, `issues.addLabels`) | `index.js` lines 23, 52 |
| Setting outputs with `core.setOutput()` | `index.js` line 58 |
| Error handling with `core.setFailed()` | `index.js` line 62 |
| `ncc` compilation (`ncc build index.js -o dist`) | `package.json` line 7 |
| Safe `pull_request_target` usage (API only, no checkout) | `test.yml` line 10 |
| Self-testing an action in its own repo | `test.yml` lines 24-34 |

## Security notes

- Uses `pull_request_target` to access `GITHUB_TOKEN` with write permissions
- Does NOT check out PR code — only reads changed file names via the API
- File names from the API are safe to process (no code execution)

## Next steps

- [Publishing to Marketplace](../../09-custom-actions/publishing-marketplace.md)
- [Versioning actions](../../09-custom-actions/versioning.md)
- [Docker action example](../docker-action/)
