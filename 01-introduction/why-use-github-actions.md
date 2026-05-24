# Why Use GitHub Actions?

## 1. Zero infrastructure overhead

GitHub provides **free hosted runners** (Linux, Windows, macOS) for public repositories and a generous free tier for private repos. No servers to manage, no build agents to patch.

## 2. Native GitHub integration

Workflows respond directly to GitHub events — pushes, pull requests, issue comments, releases, and more. Status checks appear in PRs automatically. Permissions are managed through GitHub's existing access controls.

## 3. Huge community ecosystem

Over 20,000 pre-built actions on the [GitHub Marketplace](https://github.com/marketplace?type=actions). Common tasks like checking out code (`actions/checkout`), setting up languages, caching dependencies, and deploying to cloud providers are available as single-step actions.

## 4. Simple, portable configuration

Workflows are YAML files stored in `.github/workflows/`. They live alongside your code, so they're versioned, reviewed, and forked along with the project — no external CI config to sync.

## 5. Matrix builds built in

Run tests across multiple operating systems, language versions, and dependency sets with a single matrix declaration — no plugin or external service needed.

## 6. Secure by default

- Secrets are encrypted and only exposed to selected steps
- OIDC support lets you authenticate to cloud providers without long-lived credentials
- `GITHUB_TOKEN` scopes permissions to the current workflow run

---

[← Back to index](../index.md)
