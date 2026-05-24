# What is GitHub Actions?

GitHub Actions is a CI/CD platform built into GitHub that lets you automate your software development workflows directly from your repository.

## Key idea

You define **workflows** — YAML files that describe what should happen when certain events occur in your repo. A workflow can build, test, package, and deploy your code on **runners** (virtual machines hosted by GitHub or your own infrastructure).

## What you can automate

- **CI (Continuous Integration)** — run tests on every push and pull request
- **CD (Continuous Deployment)** — deploy to staging or production on merge
- **Automation** — label issues, welcome new contributors, close stale PRs
- **Scheduled tasks** — nightly builds, dependency updates, security scans

## How it compares

| Tool | Hosted runners | Configuration | Ecosystem |
|------|---------------|---------------|-----------|
| GitHub Actions | Yes (free tier) | YAML in repo | 20,000+ community actions |
| Jenkins | Self-hosted | Groovy / UI | Plugins |
| CircleCI | Yes | YAML in repo | Orbs |
| GitLab CI | Yes | YAML in repo | Templates |

GitHub Actions is deeply integrated with GitHub itself — issues, PRs, and the API — making it the most natural choice for projects already on GitHub.

---

[← Back to index](../index.md)
