# Hello World Example

The simplest possible GitHub Actions workflow. If you've never used GitHub Actions before, start here.

## What this workflow does

1. Checks out your repository
2. Prints "Hello, world!"
3. Shows the commit SHA that triggered the run
4. Prints information about the runner
5. Lists the files in your repo
6. Prints a completion message

All of this runs on a fresh Ubuntu virtual machine provided by GitHub — you don't need to set up anything.

## How to use it

1. Copy `.github/workflows/hello.yml` into your own GitHub repository
2. Commit and push to the `main` branch
3. Open your repo on GitHub → **Actions** tab
4. Click the "Hello World" run to watch the logs stream live

You can also trigger it manually: **Actions** → **Hello World** → **Run workflow** button.

## What this demonstrates

| Concept | Where to look |
|---------|--------------|
| Workflow triggers (`on: push`, `workflow_dispatch`) | `hello.yml` line 18-21 |
| Shell commands in steps (`run:`) | `hello.yml` lines 36-56 |
| Multi-line commands (`run: \|`) | `hello.yml` line 48 |
| Expressions (`${{ github.sha }}`) | `hello.yml` line 42 |
| The `checkout` action | `hello.yml` line 33 |

## Next steps

Once this works, check out the more realistic examples:

- [Node.js CI](../nodejs-app/) — lint + test matrix + coverage
- [Python CI](../python-app/) — lint + test matrix across 4 versions
- [Java CI](../java-app/) — Maven + Checkstyle + JUnit 5
- [Docker Build & Push](../docker-app/) — multi-stage build + Docker Hub
