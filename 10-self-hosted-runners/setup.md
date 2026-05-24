# Setting Up Self-Hosted Runners

A self-hosted runner is a machine you manage that runs GitHub Actions jobs. You control the hardware, OS, installed software, and network — but you also own the maintenance, updates, and security.

---

## Where to add runners

Self-hosted runners can be added at three levels:

| Level | Path | Scope |
|-------|------|-------|
| **Repository** | Repo → Settings → Actions → Runners → New self-hosted runner | Available to one repo |
| **Organization** | Org → Settings → Actions → Runners → New runner | Available to all repos (or selected repos) |
| **Enterprise** | Enterprise → Settings → Actions → Runners | Available to all orgs |

Start at the repo level for testing. Move to org level once the runner proves reliable — then any repo in the org can use it (subject to access policies).

---

## Supported operating systems

| OS | Architectures |
|----|--------------|
| Ubuntu 20.04, 22.04, 24.04 | x64, ARM64, ARM32 |
| Debian 10, 11, 12 | x64, ARM64 |
| Red Hat Enterprise Linux 8, 9 | x64, ARM64 |
| Fedora 39, 40 | x64, ARM64 |
| CentOS Stream 8, 9 | x64, ARM64 |
| openSUSE Leap 15 | x64, ARM64 |
| Windows 10, 11 | x64, ARM64 |
| Windows Server 2019, 2022 | x64, ARM64 |
| macOS 13, 14, 15 | x64, ARM64 (Apple Silicon) |

---

## Installing the runner

### Step 1: Download and configure

From the repo/org's Actions Runners page, follow the on-screen instructions. They look like:

```bash
# Create a folder
mkdir actions-runner && cd actions-runner

# Download the latest runner package
curl -o actions-runner-linux-x64-2.322.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.322.0/actions-runner-linux-x64-2.322.0.tar.gz

# Optional: validate the hash
echo "hash-value  actions-runner-linux-x64-2.322.0.tar.gz" | shasum -a 256 -c

# Extract the installer
tar xzf ./actions-runner-linux-x64-2.322.0.tar.gz
```

### Step 2: Configure

```bash
# Configure the runner — this is interactive
./config.sh --url https://github.com/owner/repo --token YOUR_REGISTRATION_TOKEN
```

The `--token` is a one-time registration token shown on the setup page. It expires after 1 hour. Don't store it long-term.

Configuration options:

```bash
./config.sh \
  --url https://github.com/owner/repo \
  --token REGISTRATION_TOKEN \
  --name "my-linux-runner" \           # runner name (defaults to hostname)
  --labels "gpu,linux,production" \    # custom labels
  --unattended \                        # non-interactive mode
  --replace                             # replace an existing runner with the same name
  --ephemeral                           # runner deletes itself after one job
```

### Step 3: Run

```bash
# Run interactively (foreground — stops when you close the terminal)
./run.sh

# Run as a service (background, survives reboots)
sudo ./svc.sh install
sudo ./svc.sh start
```

### Checking status

```bash
sudo ./svc.sh status
```

In the GitHub UI: **Settings → Actions → Runners** — each runner shows Idle, Busy, or Offline.

---

## Labels — how jobs find runners

By default, a runner has these auto-generated labels:
- `self-hosted` (always present)
- The OS: `linux`, `windows`, `macOS`
- The architecture: `x64`, `arm64`

Add custom labels during configuration:

```bash
./config.sh --labels "gpu,nvidia,production"
```

### Using labels in workflows

```yaml
jobs:
  build:
    runs-on: [self-hosted, linux, gpu]     # must match ALL labels
```

```yaml
jobs:
  deploy:
    runs-on: [self-hosted, production]     # only production runners
```

The job waits until a runner matching **all** listed labels becomes available.

### Changing labels after setup

```bash
# Add a label
./config.sh --addlabel gpu

# Remove a label
./config.sh --removelabel gpu
```

---

## Runner groups (organization level)

Runner groups let you control which repos can use which runners:

**Org → Settings → Actions → Runner groups → New runner group**

When creating a group, choose:
- **All repositories** — any repo can use runners in this group
- **Selected repositories** — only specified repos

Then add runners to the group during configuration:

```bash
./config.sh --runnergroup my-group
```

Or move an existing runner to a group in the UI:
**Runner → Edit → Runner group**

---

## Ephemeral runners

```bash
./config.sh --ephemeral
```

An ephemeral runner processes exactly **one job**, then unregisters and deletes itself. This is the recommended mode for production self-hosted runners — it:
- Prevents state from leaking between jobs
- Eliminates "works on my machine" from leftover files
- Forces every job to start from a clean environment
- Reduces the attack surface (no persistent state)

Ephemeral runners are the foundation of autoscaling. Every runner in an autoscaling pool should be ephemeral.

---

## Removing a runner

```bash
# Stop the service
sudo ./svc.sh stop
sudo ./svc.sh uninstall

# Remove configuration
./config.sh remove --token REMOVAL_TOKEN
```

The removal token is obtained from the runner's settings page in the GitHub UI. Removing a runner immediately returns it to the pool — it won't accept new jobs.

---

## Setting up multiple runners on one machine

```bash
mkdir runner-1 && cd runner-1
./config.sh --name "runner-1"

mkdir runner-2 && cd runner-2
./config.sh --name "runner-2"
```

Each runner is a separate process with its own configuration. On a 16-core machine, you might run 4 runners (each using ~4 cores). Over-subscribing leads to resource contention — test your workload to find the right ratio.

---

## The runner application

The runner is a .NET application that:
1. Polls GitHub for pending jobs (long-poll, not busy-wait)
2. Downloads the job definition and actions
3. Executes steps in order
4. Streams logs back to GitHub
5. Updates itself (auto-update is on by default)

### Disabling auto-update

```bash
# During configuration
./config.sh --disableupdate
```

Auto-update is good for security patches but can break compatibility. For production fleets, pin the runner version and control updates yourself.

---

## Proxies and firewalls

The runner needs outbound HTTPS (port 443) to:

| Endpoint | Purpose |
|----------|---------|
| `https://github.com` | Job polling, log upload |
| `https://api.github.com` | API calls |
| `https://*.actions.githubusercontent.com` | Action downloads, runner updates |
| `https://ghcr.io` | Docker actions (container images) |
| `https://pkg.actions.githubusercontent.com` | Runner packages |

Behind a corporate proxy:

```bash
# Set proxy before configuring
export https_proxy=http://proxy.corp.example.com:8080
./config.sh --url https://github.com/owner/repo --token TOKEN
```

[← Back to index](../index.md)
