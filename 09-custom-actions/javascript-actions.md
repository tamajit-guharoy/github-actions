# JavaScript Actions

A JavaScript action is a Node.js script packaged as a GitHub Action. It runs directly on the runner (no Docker) and has access to the full `@actions/*` toolkit — workflow commands, glob, exec, I/O, and the GitHub API.

---

## When to use a JavaScript action

- You need conditional logic or API calls that are awkward in bash
- You want cross-platform compatibility without Docker
- You're building a reusable action for others to consume
- You're extending workflow capabilities beyond YAML steps

---

## Project structure

```
my-action/
├── action.yml              ← required — defines the action
├── package.json            ← Node.js project manifest
├── index.js                ← entry point (runs when the action is invoked)
├── .gitignore
└── README.md               ← required for Marketplace
```

---

## action.yml

```yaml
name: 'Hello World Action'
description: 'Greet someone and record the time'
author: 'Your Name'

inputs:
  who-to-greet:
    description: 'Who to greet'
    required: true
    default: 'World'

outputs:
  time:
    description: 'The time of greeting'
    # The output value will be set from code via core.setOutput()

runs:
  using: 'node20'
  main: 'dist/index.js'        # the compiled entry point
```

### `using:` versions

| `using:` | Node version | Status |
|----------|-------------|--------|
| `node20` | Node.js 20 | Current (use this) |
| `node16` | Node.js 16 | Deprecated |

---

## Building the action script

### package.json

```json
{
  "name": "my-action",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "ncc build index.js -o dist"
  },
  "dependencies": {
    "@actions/core": "^1.11.0",
    "@actions/github": "^6.0.0"
  },
  "devDependencies": {
    "@vercel/ncc": "^0.38.0"
  }
}
```

### index.js

```javascript
const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    // Read input
    const whoToGreet = core.getInput('who-to-greet', { required: true });

    // Access workflow context
    const context = github.context;
    const pushEvent = context.payload;

    core.info(`Hello, ${whoToGreet}!`);

    // Call the GitHub API
    const token = core.getInput('github-token', { required: true });
    const octokit = github.getOctokit(token);

    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: `👋 Hello ${whoToGreet}! Thanks for opening this issue.`
    });

    // Set output
    const time = new Date().toTimeString();
    core.setOutput('time', time);

    // Set environment variable for subsequent steps
    core.exportVariable('GREETING_TIME', time);

    // Write to the job summary
    core.summary
      .addHeading('Greeting Result')
      .addRaw(`Greeted **${whoToGreet}** at ${time}`)
      .write();

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
```

---

## The `@actions/core` toolkit

```javascript
const core = require('@actions/core');

// Inputs
const name = core.getInput('name');                // read input
const flag = core.getBooleanInput('dry-run');      // read boolean input (parses 'true'/'false')

// Outputs
core.setOutput('version', '1.2.3');                // set output for downstream steps

// Logging
core.info('Info message');                         // stdout
core.warning('Warning message');                    // creates an annotation
core.error('Error message');                        // creates an error annotation
core.setFailed('Job failed!');                      // fails the job

// Debug (only shown when ACTIONS_STEP_DEBUG secret is true)
core.debug('Debug details');

// Secrets masking
core.setSecret('my-password');                      // masks this value in logs

// Environment variables
core.exportVariable('MY_VAR', 'value');             // sets for subsequent steps

// Grouping log output
core.startGroup('Installing dependencies');
core.info('npm ci output...');
core.endGroup();

// Set output and fail shortcuts
core.setOutput('result', 'success');
core.setFailed('Something went wrong');

// Job summary
core.summary
  .addHeading('Results')
  .addTable([
    [{data: 'Test', header: true}, {data: 'Status', header: true}],
    ['Unit', '✅ Passed'],
    ['Integration', '❌ Failed']
  ])
  .write();
```

---

## The `@actions/github` toolkit

```javascript
const github = require('@actions/github');

// Workflow context (no ${{ }} needed)
github.context.repo.owner       // 'octocat'
github.context.repo.repo        // 'hello-world'
github.context.issue.number     // 42 (undefined outside issues/PRs)
github.context.sha              // commit SHA
github.context.ref              // 'refs/heads/main'
github.context.eventName        // 'push', 'pull_request', etc.
github.context.payload          // full webhook payload

// Authenticated Octokit client
const octokit = github.getOctokit(token);

// REST API (mirrors https://octokit.github.io/rest.js/)
await octokit.rest.issues.createComment({ owner, repo, issue_number, body });
await octokit.rest.repos.createRelease({ owner, repo, tag_name, name, body });
await octokit.rest.pulls.listFiles({ owner, repo, pull_number });
const { data: pulls } = await octokit.rest.pulls.list({ owner, repo, state: 'open' });

// GraphQL API
await octokit.graphql(`
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      pullRequests(first: 100, states: OPEN) {
        nodes { title number }
      }
    }
  }
`, { owner: context.repo.owner, repo: context.repo.repo });
```

---

## Compiling with `@vercel/ncc`

JavaScript actions must include all their dependencies. `ncc` (Node.js Compiler Collection) bundles your code + all `node_modules` into a single file:

```bash
npm install
npx ncc build index.js -o dist
```

This produces `dist/index.js` — a self-contained file with zero external dependencies. Commit `dist/` to your repo. Users never run `npm install` on your action.

### .gitignore

```
node_modules/
*.log
```

The `dist/` directory is **not** gitignored — it's the compiled output that consumers run.

---

## Complete action example: PR labeler

An action that auto-labels PRs based on changed files:

```javascript
// index.js
const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput('github-token', { required: true });
    const octokit = github.getOctokit(token);
    const context = github.context;

    // Only run on pull requests
    if (context.eventName !== 'pull_request') {
      core.info('Not a pull request — skipping');
      return;
    }

    // Get changed files
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: context.issue.number,
      per_page: 100
    });

    // Map file patterns to labels
    const rules = [
      { pattern: /^docs\//,    label: 'documentation' },
      { pattern: /^src\//,     label: 'code' },
      { pattern: /\.test\./,   label: 'tests' },
      { pattern: /\.ya?ml$/,    label: 'ci' },
      { pattern: /^\.github\//, label: 'ci' },
    ];

    const labels = new Set();
    for (const file of files) {
      for (const rule of rules) {
        if (rule.pattern.test(file.filename)) {
          labels.add(rule.label);
        }
      }
    }

    if (labels.size > 0) {
      await octokit.rest.issues.addLabels({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        labels: [...labels]
      });
      core.info(`Added labels: ${[...labels].join(', ')}`);
    } else {
      core.info('No labels matched');
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
```

---

## Testing JavaScript actions locally

Use `act` or write unit tests with Jest:

```javascript
// index.test.js
const core = require('@actions/core');
const github = require('@actions/github');

jest.mock('@actions/core');
jest.mock('@actions/github');

const { run } = require('./index');

test('sets output on success', async () => {
  github.context = { eventName: 'push', payload: {} };
  github.getOctokit = jest.fn(() => ({
    rest: {
      issues: { createComment: jest.fn() }
    }
  }));

  core.getInput = jest.fn((name) => name === 'who-to-greet' ? 'World' : 'fake-token');

  require('./index'); // triggers run()

  expect(core.setOutput).toHaveBeenCalledWith('time', expect.any(String));
});
```

---

## Key takeaways

1. **Use `ncc` to bundle** — commit the compiled `dist/index.js`, not `node_modules`
2. **`@actions/core`** handles inputs, outputs, logging, masking, and summaries
3. **`@actions/github`** provides an authenticated Octokit + workflow context
4. **Always catch errors** and call `core.setFailed()` — unhandled rejections produce confusing logs
5. **Pin to `node20`** — `node16` is deprecated

[← Back to index](../index.md)
