# GitHub Actions Tutorial

A hands-on guide to automating your software workflows with GitHub Actions.

---

## 1. Introduction

- [What is GitHub Actions?](01-introduction/what-is-github-actions.md)
- [Why use GitHub Actions?](01-introduction/why-use-github-actions.md)
- [Pricing & limits](01-introduction/pricing-and-limits.md)

## 2. Core Concepts

- [Workflows](02-core-concepts/workflows.md)
- [Jobs](02-core-concepts/jobs.md)
- [Steps](02-core-concepts/steps.md)
- [Actions](02-core-concepts/actions.md)
- [Runners](02-core-concepts/runners.md)
- [Events & triggers](02-core-concepts/events-and-triggers.md)

## 3. Your First Workflow

- [Creating a workflow file](03-first-workflow/creating-a-workflow-file.md)
- [Workflow syntax overview](03-first-workflow/workflow-syntax.md)
- [Running your first workflow](03-first-workflow/running-your-first-workflow.md)
- [Viewing workflow results](03-first-workflow/viewing-results.md)

## 4. Workflow Syntax Deep Dive

- [name, on, permissions](04-workflow-syntax/name-on-permissions.md)
- [jobs.<job_id>](04-workflow-syntax/jobs.md)
- [runs-on](04-workflow-syntax/runs-on.md)
- [steps structure](04-workflow-syntax/steps-structure.md)
- [Expressions & contexts](04-workflow-syntax/expressions-and-contexts.md)
- [Conditionals (if)](04-workflow-syntax/conditionals.md)
- [Environment variables (env)](04-workflow-syntax/environment-variables.md)
- [Defaults](04-workflow-syntax/defaults.md)

## 5. Essential Built-in Actions

- [actions/checkout](05-built-in-actions/checkout.md)
- [actions/setup-node, setup-python, setup-java, etc.](05-built-in-actions/setup-languages.md)
- [actions/cache](05-built-in-actions/cache.md)
- [actions/upload-artifact & download-artifact](05-built-in-actions/artifacts.md)
- [actions/create-release](05-built-in-actions/create-release.md)
- [github-script](05-built-in-actions/github-script.md)

## 6. Secrets & Environments

- [Repository secrets](06-secrets-and-environments/repository-secrets.md)
- [Organization secrets](06-secrets-and-environments/organization-secrets.md)
- [Environments](06-secrets-and-environments/environments.md)
- [Environment protection rules](06-secrets-and-environments/protection-rules.md)
- [OIDC & cloud provider auth](06-secrets-and-environments/oidc.md)

## 7. Advanced Workflow Patterns

- [Matrix strategies](07-advanced-patterns/matrix-strategies.md)
- [Reusable workflows](07-advanced-patterns/reusable-workflows.md)
- [Composite actions](07-advanced-patterns/composite-actions.md)
- [Job outputs & dependencies](07-advanced-patterns/job-outputs.md)
- [Service containers](07-advanced-patterns/service-containers.md)
- [Concurrency control](07-advanced-patterns/concurrency.md)

## 8. CI/CD Examples

- [Node.js CI](08-cicd-examples/nodejs-ci.md)
- [Python CI with pytest](08-cicd-examples/python-ci.md)
- [Docker build & push](08-cicd-examples/docker-build-push.md)
- [Deploy to GitHub Pages](08-cicd-examples/deploy-github-pages.md)
- [Deploy to cloud providers](08-cicd-examples/deploy-cloud.md)
- [Scheduled jobs & cron](08-cicd-examples/scheduled-jobs.md)

## 9. Custom Actions

- [JavaScript actions](09-custom-actions/javascript-actions.md)
- [Docker container actions](09-custom-actions/docker-actions.md)
- [Publishing to GitHub Marketplace](09-custom-actions/publishing-marketplace.md)
- [Versioning & releases](09-custom-actions/versioning.md)

## 10. Self-Hosted Runners

- [Setting up self-hosted runners](10-self-hosted-runners/setup.md)
- [Security considerations](10-self-hosted-runners/security.md)
- [Autoscaling runners](10-self-hosted-runners/autoscaling.md)

## 11. Debugging & Troubleshooting

- [Workflow logs & debug logging](11-debugging/logs-and-debug.md)
- [act — run workflows locally](11-debugging/act-local-runner.md)
- [Common pitfalls](11-debugging/common-pitfalls.md)

## 12. Best Practices

- [Workflow organization](12-best-practices/workflow-organization.md)
- [Security hardening](12-best-practices/security-hardening.md)
- [Performance optimization](12-best-practices/performance.md)
- [Maintainability](12-best-practices/maintainability.md)

## Examples

Working example applications with full CI/CD workflows that you can copy and push to GitHub right now:

- [Node.js Express API](examples/nodejs-app/) — lint, test matrix, coverage artifacts
- [Python Calculator](examples/python-app/) — lint, test matrix across 4 Python versions
- [Java Maven (JUnit 5)](examples/java-app/) — lint, test matrix across 3 Java versions
- [Docker Build & Push](examples/docker-app/) — multi-stage build, push to Docker Hub with GHA cache

Each example includes a real app, real tests, and a working `.github/workflows/ci.yml` (or equivalent).

## Appendix

- [Glossary](appendix/glossary.md)
- [Workflow YAML reference](appendix/yaml-reference.md)
- [Further resources](appendix/further-resources.md)
