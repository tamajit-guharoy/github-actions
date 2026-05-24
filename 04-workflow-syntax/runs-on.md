# runs-on

The `runs-on` key tells GitHub what kind of machine to provision for a job. Every job must specify a runner.

---

## GitHub-hosted runners

These are managed by GitHub. You get a fresh VM for every job — no state persists between runs.

### Available runner images

| Label | OS | Architecture |
|-------|----|-------------|
| `ubuntu-latest` | Ubuntu (latest LTS) | x64, ARM64 |
| `ubuntu-24.04` | Ubuntu 24.04 | x64, ARM64 |
| `ubuntu-22.04` | Ubuntu 22.04 | x64, ARM64 |
| `windows-latest` | Windows Server 2025 | x64, ARM64 |
| `windows-2022` | Windows Server 2022 | x64 |
| `macos-latest` | macOS (latest) | x64, ARM64 |
| `macos-15` | macOS 15 | ARM64 (Apple Silicon) |
| `macos-14` | macOS 14 | ARM64 (Apple Silicon) |
| `macos-13` | macOS 13 | x64 |

Use `-latest` for most cases. Pin a specific version (e.g., `ubuntu-24.04`) when you need deterministic behavior.

### Runner specs (as of 2025)

| Label | CPU cores | RAM | SSD |
|-------|----------|-----|-----|
| Ubuntu | 4 | 16 GB | 150 GB |
| Windows | 4 | 16 GB | 150 GB |
| macOS (x64) | 3 | 14 GB | 150 GB |
| macOS (ARM64) | 4 | 14 GB | 150 GB |

### Larger runners (paid plans)

| Size | CPU | RAM | SSD | Use case |
|------|-----|-----|----|----------|
| 2-core | 2 | 8 GB | 150 GB | Light builds |
| 4-core (default) | 4 | 16 GB | 150 GB | Most CI jobs |
| 8-core | 8 | 32 GB | 300 GB | Monorepo builds |
| 16-core | 16 | 64 GB | 600 GB | Heavy compilation |
| 32-core | 32 | 128 GB | 1,200 GB | Massive parallel builds |
| GPU (T4) | 4 | 16 GB | 150 GB | ML/AI workloads |

Larger runners cost more minutes. See the [pricing docs](../01-introduction/pricing-and-limits.md) for minute multipliers.

---

## Using a GitHub-hosted runner

```yaml
jobs:
  build:
    runs-on: ubuntu-latest         # cheapest, fastest to provision
```

```yaml
jobs:
  build:
    runs-on: windows-latest        # .NET Framework, MSBuild, Windows-specific tools
```

```yaml
jobs:
  build:
    runs-on: macos-latest          # iOS/macOS builds (Swift, Xcode)
```

### ARM64 runners

Add an `-arm64` suffix for ARM-native builds:

```yaml
jobs:
  build:
    runs-on: ubuntu-24.04-arm64
```

```yaml
jobs:
  build:
    runs-on: macos-latest-xlarge   # M-series Apple Silicon
```

---

## Self-hosted runners

```yaml
jobs:
  build:
    runs-on: self-hosted
```

Or with custom labels:

```yaml
jobs:
  build:
    runs-on: [self-hosted, linux, gpu]
```

The `self-hosted` label is required. Additional labels let you target specific machines. Self-hosted runners are **not ephemeral** — state persists between jobs unless you explicitly clean up.

---

## Runner groups

Organizations and enterprises can organize self-hosted runners into groups:

```yaml
jobs:
  build:
    runs-on: my-runner-group       # targets runners in a specific group
```

Groups can have access restrictions (which repos can use them) defined in org/enterprise settings.

---

## Runner images CLI

To see exactly what software is preinstalled on each image:

- [github.com/actions/runner-images](https://github.com/actions/runner-images) — the source repos
- `ubuntu-latest`: [images/ubuntu](https://github.com/actions/runner-images/tree/main/images/ubuntu)
- `windows-latest`: [images/windows](https://github.com/actions/runner-images/tree/main/images/windows)
- `macos-latest`: [images/macos](https://github.com/actions/runner-images/tree/main/images/macos)

Each image readme lists every preinstalled tool and version.

---

## Choosing the right runner

| You need | Use |
|----------|-----|
| Standard CI for a Node.js/Python/Go/Ruby app | `ubuntu-latest` |
| .NET Framework or MSBuild | `windows-latest` |
| iOS/macOS app builds | `macos-latest` |
| Apple Silicon native builds | `macos-latest-xlarge` |
| Custom hardware or software | `self-hosted` |
| GPU compute | Larger runner with GPU |
| ARM64-native Linux | `ubuntu-24.04-arm64` |

---

## Real examples

From the tutorial's example apps:

```yaml
# Node.js CI — standard Linux
jobs:
  lint:
    runs-on: ubuntu-latest
```

```yaml
# Docker build — uses Linux (Docker only runs on Linux natively)
jobs:
  build-and-push:
    runs-on: ubuntu-latest
```

See the full workflows:
- [Node.js CI](../examples/nodejs-app/.github/workflows/ci.yml)
- [Docker Build & Push](../examples/docker-app/.github/workflows/docker-build-push.yml)

[← Back to index](../index.md)
