# act — Run Workflows Locally

`act` is an open-source tool that runs GitHub Actions workflows on your local machine using Docker. It lets you test workflows without pushing to GitHub — fast feedback, no wasted runner minutes, and no polluting your commit history with "fix CI" commits.

---

## Installation

### macOS (Homebrew)

```bash
brew install act
```

### Windows (Chocolatey / Scoop / winget)

```bash
choco install act-cli
# or
scoop install act
# or
winget install nektos.act
```

### Linux

```bash
curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

Or download the binary from [github.com/nektos/act/releases](https://github.com/nektos/act/releases).

### Docker requirement

`act` requires Docker (or Podman) to run containers that simulate GitHub's runner environment. Docker Desktop, Docker Engine, or Podman all work.

```bash
docker --version       # must be installed and running
```

---

## Basic usage

```bash
# Run the default push event (runs all jobs in the workflow)
act

# Run a specific event
act pull_request

# Run a specific job
act -j test

# Run a specific workflow file
act -W .github/workflows/ci.yml
```

`act` reads your `.github/workflows/*.yml` files and executes them in Docker containers. It simulates the complete workflow lifecycle — checkout, setup actions, run steps, artifact upload.

---

## Listing what's available

```bash
# List all workflows
act -l

# List all jobs
act -l -W .github/workflows/ci.yml
```

Output:
```
Stage  Job ID   Workflow name   File
0      lint     Node.js CI      ci.yml
1      test     Node.js CI      ci.yml
```

---

## Simulating events

```bash
# Push event (default)
act push

# Pull request event
act pull_request

# Schedule event
act schedule

# Workflow dispatch with inputs
act workflow_dispatch -i environment=staging

# Release event
act release
```

---

## Secrets and environment variables

`act` doesn't have access to your GitHub secrets. Pass them explicitly:

### Via command line

```bash
act -s DOCKERHUB_USERNAME=myuser -s DOCKERHUB_TOKEN=mytoken
```

### Via `.secrets` file

Create a `.secrets` file (add it to `.gitignore`):

```
DOCKERHUB_USERNAME=myuser
DOCKERHUB_TOKEN=mytoken
AWS_ACCESS_KEY_ID=AKIA...
```

```bash
act --secret-file .secrets
```

### Environment variables

```bash
act --env MY_VAR=hello
# or from a file
act --env-file .env
```

---

## Matrix strategies

`act` by default runs **one random** combination from the matrix. To control it:

```bash
# Run all matrix combinations
act --matrix node-version:18
act --matrix node-version:20
act --matrix node-version:22

# Or run all (can be slow — 9 jobs for a 3x3 matrix)
act --matrix
```

---

## Runner images

`act` uses Docker images that approximate GitHub's runner images. By default it uses `catthehacker/ubuntu:act-latest`.

```bash
# Use a specific size (large = more preinstalled tools)
act -P ubuntu-latest=catthehacker/ubuntu:act-latest     # ~1 GB
act -P ubuntu-latest=catthehacker/ubuntu:full-latest     # ~20 GB

# Use an image close to GitHub's
act -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:runner-latest
```

For Windows and macOS runners, `act` can't fully simulate the OS. Use `ubuntu-latest` images even if your real workflow uses another OS — the workflow syntax is what you're testing, not the OS specifics.

---

## What act CAN do

- Validate YAML syntax
- Test the flow of steps and jobs
- Catch missing inputs, typos in `${{ }}` expressions
- Verify `if:` conditions evaluate as expected
- Test artifact upload/download (local directory)
- Verify `needs` ordering and job dependencies

## What act CANNOT do

- Access real GitHub secrets (must pass locally)
- Run Windows/macOS-specific steps natively
- Access the GitHub API with `GITHUB_TOKEN`
- Simulate `pull_request_target` correctly
- Use GitHub-hosted action caching (`cache: 'npm'`)
- Run Docker-in-Docker reliably (runs inside a container already)
- Match the exact GitHub runner image (different preinstalled tool versions)

---

## Common `act` issues

### Docker socket not found

```
Error: Cannot connect to the Docker daemon
```

Start Docker Desktop, or set `DOCKER_HOST` if using a remote Docker:

```bash
export DOCKER_HOST=unix:///run/user/1000/docker.sock
act
```

### Container image too large

```bash
# Default image is ~1 GB. First run downloads it.
# Use a minimal image if you only need basic tools:
act -P ubuntu-latest=ubuntu:22.04
```

### `GITHUB_TOKEN` not available

```bash
# Pass a PAT as GITHUB_TOKEN
act -s GITHUB_TOKEN=$(gh auth token)
```

### Step works in act but fails on GitHub

This is usually a tool version mismatch. Check:
- `act` image version: `docker run --rm catthehacker/ubuntu:act-latest node --version`
- GitHub runner: check the runner images repo for preinstalled versions

---

## workflow test loop

The ideal development loop for a new workflow:

1. **Write** the YAML locally
2. **Run** `act push` to validate syntax and step flow
3. **Fix** errors — iterate here (seconds, not minutes)
4. **Push** to a feature branch when it passes locally
5. **Open a PR** — let the real GitHub runner verify the final result

This saves dozens of "fix typo" commits and uses far fewer Actions minutes.

---

## Alternatives to act

| Tool | Approach | Best for |
|------|----------|----------|
| `act` | Docker-based local runner | Fast local iteration |
| `nektos/act` (GitHub Action) | Run act inside a workflow | CI testing of workflows |
| Manual `bash` script | Run the same commands locally | Simple workflows |
| GitHub-hosted runner on a dev branch | Push and watch | Final verification |

[← Back to index](../index.md)
