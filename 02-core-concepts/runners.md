# Runners

A **runner** is the machine that executes your workflow jobs. Every job specifies a `runs-on` label that picks the runner type.

## GitHub-hosted runners

GitHub provides managed virtual machines with pre-installed tooling.

| Label | OS | Processor |
|-------|-----|-----------|
| `ubuntu-latest` | Ubuntu 24.04 | x64 / ARM64 |
| `windows-latest` | Windows Server 2025 | x64 |
| `macos-latest` | macOS 15 (Sequoia) | Apple Silicon (M2) |
| `macos-13` | macOS 13 (Ventura) | x64 (Intel) |

Use `-latest` to automatically get the newest image, or pin to a specific version like `ubuntu-22.04` for stability.

## What comes pre-installed

GitHub-hosted runners include:
- Common language runtimes (Node, Python, Ruby, Go, Java, .NET)
- Package managers (npm, pip, gem, NuGet)
- Docker, kubectl, Terraform, Azure CLI, AWS CLI, gcloud
- Build tools (GCC, Clang, MSBuild, Xcode)

See the full manifest at [`actions/runner-images`](https://github.com/actions/runner-images).

## Self-hosted runners

You can register your own machine as a runner for full control over hardware, software, and network access.

```yaml
jobs:
  build:
    runs-on: [self-hosted, linux, gpu]   # matches by label

  test-linux:
    runs-on: ubuntu-latest               # GitHub-hosted (see matrix in examples)

  test-windows:
    runs-on: windows-latest

  test-macos:
    runs-on: macos-latest
```

**Free tier:** Unlimited minutes on self-hosted runners for both public and private repos — you provide the compute.

## Runner isolation

- Each job gets a **fresh runner** — no state carries over from previous jobs
- GitHub-hosted runners are **disposed** after the job completes
- Self-hosted runners are **reused** — be careful about leftover state (use cleanup steps or ephemeral mode)

---

[← Back to index](../index.md)
