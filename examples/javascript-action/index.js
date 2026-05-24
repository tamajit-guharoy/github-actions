// =============================================================================
// PR File Labeler — JavaScript Action Entry Point
// =============================================================================
// Reads changed files from the PR, matches them against configurable glob
// rules, and adds corresponding labels.

const core = require('@actions/core');
const github = require('@actions/github');
const { minimatch } = require('minimatch');

async function run() {
  try {
    // Only run on pull request events — skip everything else
    if (github.context.eventName !== 'pull_request') {
      core.info('Not a pull request event — skipping');
      return;
    }

    // Read inputs
    const token = core.getInput('github-token', { required: true });
    const rulesJson = core.getInput('rules', { required: true });
    const rules = JSON.parse(rulesJson);

    core.info(`Loaded ${Object.keys(rules).length} label rules`);
    const octokit = github.getOctokit(token);

    // Fetch all changed files in the PR
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: github.context.issue.number,
      per_page: 100
    });

    const filenames = files.map(f => f.filename);
    core.info(`PR #${github.context.issue.number} changes ${filenames.length} file(s):`);
    filenames.forEach(f => core.info(`  ${f}`));

    // Match files against rules
    const labels = new Set();
    for (const [pattern, label] of Object.entries(rules)) {
      const matches = filenames.filter(f => minimatch(f, pattern));
      if (matches.length > 0) {
        core.info(`Pattern "${pattern}" matched ${matches.length} file(s) → label "${label}"`);
        labels.add(label);
      }
    }

    if (labels.size === 0) {
      core.info('No labels matched — nothing to add');
      core.setOutput('labels-added', '');
      return;
    }

    // Add the labels to the PR
    await octokit.rest.issues.addLabels({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: github.context.issue.number,
      labels: [...labels]
    });

    core.info(`Added labels: ${[...labels].join(', ')}`);
    core.setOutput('labels-added', [...labels].join(','));

  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();
