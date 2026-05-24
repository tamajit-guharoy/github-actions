# github-script

`actions/github-script` lets you write JavaScript that interacts with the GitHub API directly in your workflow — no separate script file, no token management, no dependency installation. It provides a pre-authenticated Octokit client and access to the full workflow context.

---

## Basic usage

```yaml
steps:
  - uses: actions/github-script@v7
    with:
      script: |
        console.log('Hello from JavaScript!');
        console.log(`Repo: ${context.repo.owner}/${context.repo.repo}`);
        console.log(`Triggered by: ${context.actor}`);
```

The `script` runs in a Node.js environment. `github` is an authenticated Octokit instance, and `context` holds workflow metadata.

---

## The `github` object — calling the API

`github` is a pre-authenticated [Octokit](https://github.com/octokit/rest.js) REST client:

```yaml
steps:
  - uses: actions/github-script@v7
    with:
      script: |
        // List open issues
        const issues = await github.rest.issues.listForRepo({
          owner: context.repo.owner,
          repo: context.repo.repo,
          state: 'open',
          per_page: 100
        });
        console.log(`Found ${issues.data.length} open issues`);

        // Comment on a PR
        await github.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: context.issue.number,
          body: 'Thanks for the PR! 🚀'
        });
```

### Common API calls

```javascript
// Get a file's content
const { data } = await github.rest.repos.getContent({
  owner: context.repo.owner,
  repo: context.repo.repo,
  path: 'package.json'
});

// List workflow runs
const runs = await github.rest.actions.listWorkflowRuns({
  owner: context.repo.owner,
  repo: context.repo.repo,
  workflow_id: 'ci.yml'
});

// Create a label
await github.rest.issues.createLabel({
  owner: context.repo.owner,
  repo: context.repo.repo,
  name: 'automated',
  color: '0366d6'
});

// Add labels to a PR
await github.rest.issues.addLabels({
  owner: context.repo.owner,
  repo: context.repo.repo,
  issue_number: context.issue.number,
  labels: ['ready-for-review']
});

// Get a release by tag
const release = await github.rest.repos.getReleaseByTag({
  owner: context.repo.owner,
  repo: context.repo.repo,
  tag: 'v1.0.0'
});
```

---

## The `context` object

`context` contains parsed workflow metadata (no `${{ }}` needed):

```javascript
context.repo.owner          // 'owner'
context.repo.repo           // 'repo'
context.issue.number        // 42 (only in issue/PR events)
context.actor               // username who triggered
context.eventName           // 'push', 'pull_request', etc.
context.ref                 // 'refs/heads/main'
context.sha                 // commit SHA
context.runId               // this run's ID
context.payload             // full webhook payload
```

---

## The `core` object — workflow commands

`core` provides the same functions as the `@actions/core` npm package:

```javascript
core.info('An info message');          // prints to log
core.warning('A warning');             // creates an annotation
core.error('An error');                // creates an error annotation
core.setFailed('Job failed!');         // fails the job (non-zero exit)

core.setOutput('version', '1.2.3');    // sets step output
core.exportVariable('MY_VAR', 'val');  // sets env var for later steps

core.setSecret('my-password');         // masks this value in logs

core.startGroup('Section 1');          // collapsible log group
core.info('Content inside group');
core.endGroup();

core.summary.addHeading('Results');    // add to job summary
core.summary.addTable([
  [{data: 'Test', header: true}, {data: 'Status', header: true}],
  ['unit', '✅ passed'],
  ['integration', '❌ failed']
]);
core.summary.write();
```

---

## Complete examples

### Auto-label PRs by file paths

```yaml
on:
  pull_request:
    types: [opened]

jobs:
  label:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write          # needed to add labels
    steps:
      - uses: actions/checkout@v4
      - uses: actions/github-script@v7
        with:
          script: |
            const { data: files } = await github.rest.pulls.listFiles({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number
            });

            const labels = new Set();
            for (const file of files) {
              if (file.filename.startsWith('docs/')) labels.add('documentation');
              if (file.filename.endsWith('.yml') || file.filename.endsWith('.yaml'))
                labels.add('ci');
              if (file.filename.startsWith('src/')) labels.add('code');
            }

            if (labels.size > 0) {
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                labels: [...labels]
              });
            }
```

### Post PR comment with test coverage

```yaml
steps:
  - run: npm test -- --coverage
  - uses: actions/github-script@v7
    if: github.event_name == 'pull_request'
    with:
      script: |
        const fs = require('fs');
        const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
        const pct = coverage.total.lines.pct;

        let emoji = '🟢';
        if (pct < 80) emoji = '🟡';
        if (pct < 60) emoji = '🔴';

        await github.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: context.issue.number,
          body: `## Coverage Report\n\n${emoji} **${pct}%** line coverage\n\n| Lines | Branches | Functions |\n|-------|----------|----------|\n| ${coverage.total.lines.pct}% | ${coverage.total.branches.pct}% | ${coverage.total.functions.pct}% |`
        });
```

### Close stale issues

```yaml
on:
  schedule:
    - cron: '0 8 * * 1'              # every Monday morning

jobs:
  stale:
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            const days = 30;
            const since = new Date();
            since.setDate(since.getDate() - days);

            const { data: issues } = await github.rest.issues.listForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'open',
              labels: 'stale',
              since: since.toISOString()
            });

            for (const issue of issues) {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                body: `Closing — stale for ${days}+ days.`
              });
              await github.rest.issues.update({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                state: 'closed'
              });
            }
            console.log(`Closed ${issues.length} stale issues`);
```

---

## GraphQL API

Use `github.graphql` for complex queries:

```yaml
- uses: actions/github-script@v7
  with:
    script: |
      const query = `
        query($owner: String!, $repo: String!) {
          repository(owner: $owner, name: $repo) {
            pullRequests(first: 100, states: OPEN) {
              nodes { title number author { login } }
            }
          }
        }
      `;
      const result = await github.graphql(query, {
        owner: context.repo.owner,
        repo: context.repo.repo
      });
      console.log(JSON.stringify(result, null, 2));
```

---

## Using external dependencies

Load npm packages from a separate script or with `retry`:

```yaml
- uses: actions/github-script@v7
  with:
    script: |
      // Some common packages are available automatically via Octokit.
      // For anything else, put your logic in a separate .js file and run it with `node`.
```

For complex scripts with many dependencies, use a separate action file:

```yaml
steps:
  - run: npm ci
  - run: node .github/scripts/complex-logic.js
```

---

## github-script vs curl vs gh cli

| Approach | Best for |
|----------|----------|
| `github-script` | Complex logic, conditionals, chaining API calls, reading files |
| `curl` with raw API | Quick one-off API calls, no JavaScript needed |
| `gh` CLI | Interactive or one-line operations you'd run locally |
| Separate script file | Complex logic with many dependencies |

[← Back to index](../index.md)
