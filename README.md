# GitHub Actions Tutorial

A comprehensive tutorial with 12 working example workflows — from Hello World to custom actions, service containers, and GitHub API automation.

## Workflow Status

| Workflow | Status |
|----------|--------|
| Hello World | [![Hello World](https://github.com/tamajit-guharoy/github-actions/actions/workflows/hello-world.yml/badge.svg)](https://github.com/tamajit-guharoy/github-actions/actions/workflows/hello-world.yml) |
| Node.js CI | [![Node.js CI](https://github.com/tamajit-guharoy/github-actions/actions/workflows/nodejs-ci.yml/badge.svg)](https://github.com/tamajit-guharoy/github-actions/actions/workflows/nodejs-ci.yml) |
| Python CI | [![Python CI](https://github.com/tamajit-guharoy/github-actions/actions/workflows/python-ci.yml/badge.svg)](https://github.com/tamajit-guharoy/github-actions/actions/workflows/python-ci.yml) |
| Java CI | [![Java CI](https://github.com/tamajit-guharoy/github-actions/actions/workflows/java-ci.yml/badge.svg)](https://github.com/tamajit-guharoy/github-actions/actions/workflows/java-ci.yml) |
| Service Containers CI | [![Service Containers CI](https://github.com/tamajit-guharoy/github-actions/actions/workflows/service-containers-ci.yml/badge.svg)](https://github.com/tamajit-guharoy/github-actions/actions/workflows/service-containers-ci.yml) |
| Monorepo CI | [![Monorepo CI](https://github.com/tamajit-guharoy/github-actions/actions/workflows/monorepo-ci.yml/badge.svg)](https://github.com/tamajit-guharoy/github-actions/actions/workflows/monorepo-ci.yml) |
| Composite Action CI | [![Composite Action CI](https://github.com/tamajit-guharoy/github-actions/actions/workflows/composite-action-ci.yml/badge.svg)](https://github.com/tamajit-guharoy/github-actions/actions/workflows/composite-action-ci.yml) |
| Reusable Workflow CI | [![Reusable Workflow CI](https://github.com/tamajit-guharoy/github-actions/actions/workflows/reusable-workflow-ci.yml/badge.svg)](https://github.com/tamajit-guharoy/github-actions/actions/workflows/reusable-workflow-ci.yml) |
| JavaScript Action CI | [![JavaScript Action CI](https://github.com/tamajit-guharoy/github-actions/actions/workflows/javascript-action-ci.yml/badge.svg)](https://github.com/tamajit-guharoy/github-actions/actions/workflows/javascript-action-ci.yml) |
| Docker Action CI | [![Docker Action CI](https://github.com/tamajit-guharoy/github-actions/actions/workflows/docker-action-ci.yml/badge.svg)](https://github.com/tamajit-guharoy/github-actions/actions/workflows/docker-action-ci.yml) |
| GitHub Script Demos | [![GitHub Script Demos](https://github.com/tamajit-guharoy/github-actions/actions/workflows/github-script-demos.yml/badge.svg)](https://github.com/tamajit-guharoy/github-actions/actions/workflows/github-script-demos.yml) |
| Validate Examples | [![Validate Examples](https://github.com/tamajit-guharoy/github-actions/actions/workflows/validate-examples.yml/badge.svg)](https://github.com/tamajit-guharoy/github-actions/actions/workflows/validate-examples.yml) |

## Tutorial Sections

1. **Introduction** — What is GitHub Actions, why use it, pricing & limits
2. **Core Concepts** — Workflows, jobs, steps, actions, runners, events
3. **Your First Workflow** — Creating, running, and viewing results
4. **Workflow Syntax** — Deep dive into YAML syntax, expressions, conditionals
5. **Built-in Actions** — checkout, setup-languages, cache, artifacts, releases
6. **Secrets & Environments** — Repo/org secrets, environments, OIDC
7. **Advanced Patterns** — Matrix strategies, reusable workflows, composite actions
8. **CI/CD Examples** — Node.js, Python, Docker, GitHub Pages, cloud deploy
9. **Custom Actions** — JavaScript, Docker, publishing to Marketplace
10. **Self-Hosted Runners** — Setup, security, autoscaling
11. **Debugging** — Logs, act local runner, common pitfalls
12. **Best Practices** — Organization, security hardening, performance

## Examples

Each example in `examples/` is a working project with its own workflow:

- `hello-world/` — Minimal workflow
- `nodejs-app/` — Express API with Jest + ESLint
- `python-app/` — Calculator with pytest + Ruff
- `java-app/` — Maven calculator with JUnit + Checkstyle
- `docker-app/` — Docker build + GitHub Pages deploy
- `service-containers/` — Node.js + PostgreSQL integration tests
- `composite-action/` — Reusable composite action
- `reusable-workflow/` — Reusable caller workflow
- `javascript-action/` — PR labeler custom action
- `docker-action/` — Markdown-to-HTML container action
- `monorepo/` — Cross-language Node.js + Python
- `github-script/` — GitHub API automation with Octokit
