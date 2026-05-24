# Security Considerations for Self-Hosted Runners

Self-hosted runners give you full control — and full responsibility. A compromised runner can expose your repository, secrets, internal network, and cloud infrastructure. This page covers the risks and the mitigations.

---

## The fundamental risk

On GitHub-hosted runners, every job gets a fresh VM that's destroyed afterward. A malicious workflow can't persist state, plant backdoors, or pivot to other jobs.

On self-hosted runners, jobs run on machines you own. Without precautions, a workflow can:
- Leave files that subsequent jobs read
- Install persistent services
- Access your internal network and databases
- Exfiltrate secrets through the local filesystem

**Default recommendation: always use ephemeral runners.** A runner that destroys itself after one job eliminates the largest category of risks.

---

## Ephemeral runners

```bash
./config.sh --ephemeral
```

This is the single most impactful security decision for self-hosted runners. An ephemeral runner:
- Processes exactly one job
- Deletes its configuration
- Optionally terminates the host machine/VM/container

Without ephemeral mode, Job A can leave a file in `/tmp/` that Job B reads. If Job A is from a PR feature branch and Job B is from `main` with production secrets, you have a data leak path.

---

## Public repositories: a special danger

**Never run a self-hosted runner on a public repository** unless you fully understand the risks.

Anyone can submit a PR to a public repo. If your self-hosted runner executes PR code:
- The PR can run arbitrary commands on your machine
- The PR can access your network, file system, and installed tools
- The PR may have access to `GITHUB_TOKEN` with repository write permissions

If you must use self-hosted runners on a public repo:
1. **Only run workflows on `main`** — not on PRs:

```yaml
on:
  push:
    branches: [main]
  # No pull_request trigger
```

2. If you need PR workflows, use `pull_request_target` ONLY for read-only operations:

```yaml
on:
  pull_request_target:
    types: [labeled]

jobs:
  comment:
    runs-on: [self-hosted, linux]
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              ...context.repo,
              issue_number: context.issue.number,
              body: 'Processing...'
            });
      # DO NOT: actions/checkout@v4 (would run PR code)
```

3. Isolate the runner on a separate network segment with no access to production systems.
4. Use ephemeral runners that self-destruct after every job.

---

## Network isolation

Put self-hosted runners in a **separate network segment** that:
- **Can** reach the internet (to download actions and talk to GitHub)
- **Cannot** reach production databases, internal APIs, or admin panels
- **Cannot** initiate connections to developer workstations

```
[Internet] ←→ [DMZ: Self-Hosted Runners] -/-> [Production Network]
```

If a runner needs production access (e.g., for deployment), use OIDC with tightly scoped cloud credentials — not network-level access.

---

## Secrets on self-hosted runners

Secrets are sent to self-hosted runners the same way as GitHub-hosted runners. However, since you control the machine, a malicious actor with shell access could potentially:

- Read secret values from environment variables of running processes
- Intercept secrets from the runner's in-memory state
- Access the `.runner/` directory which contains encrypted credentials

### Mitigations

1. **Use OIDC instead of secrets** — short-lived tokens, no long-lived credentials to steal
2. **Rotate secrets frequently** if you must use them
3. **Restrict which workflows can use production secrets** with environments + protection rules
4. **Audit workflow code** that runs on self-hosted runners — a script that does `env >> /tmp/secrets.txt` is trivial

---

## Runner application security

### The `.credentials` file

The runner stores an OAuth token in `.runner/.credentials` (Linux) or `_diag/.runner` (Windows). This token authenticates the runner to GitHub. Protect it like a secret:

```bash
chmod 600 .runner/.credentials
```

Anyone with read access to this file can register runners in your name.

### Runner auto-update

The runner auto-updates by default. This is generally good (security patches) but can introduce breaking changes. For production fleets:

```bash
# Pin the version
./config.sh --disableupdate
```

Then update on a schedule you control. Test new versions in a staging runner group before rolling to production.

---

## Audit logging

GitHub logs these self-hosted runner events:

| Event | Where |
|-------|-------|
| Runner registered/unregistered | Organization audit log |
| Runner group created/deleted | Organization audit log |
| Runner labels changed | Organization audit log |
| Workflow job dispatched to a runner | Workflow run log |

Review audit logs at: **Organization → Settings → Archive → Audit log**

For additional monitoring, the runner writes diagnostic logs:

```bash
# Runner diagnostic logs
tail -f ~/actions-runner/_diag/*.log
```

---

## Hardening checklist

- [ ] Ephemeral runners only (`--ephemeral`)
- [ ] No self-hosted runners on public repos (use GitHub-hosted)
- [ ] Network segment with no access to production
- [ ] OIDC for cloud auth (no long-lived credentials)
- [ ] `.credentials` file permissions locked down (`chmod 600`)
- [ ] Runner auto-update enabled (or manual update schedule)
- [ ] Production secrets in environments with protection rules
- [ ] Regular audit log review
- [ ] Runner application runs as a dedicated service account (not root/Administrator)
- [ ] OS-level firewall restricting outbound connections to GitHub domains only

---

## Running as a non-root user

By default, the runner executes jobs as the user who installed it. On Linux, create a dedicated `actions-runner` user:

```bash
sudo useradd -m -s /bin/bash actions-runner
sudo su - actions-runner
# Then download, extract, and configure the runner as this user
```

On Windows, run the service as a managed service account (gMSA) or a dedicated local account — not `SYSTEM` or the Administrator.

---

## When to use GitHub-hosted instead

| Scenario | Recommendation |
|----------|---------------|
| Public repo CI | GitHub-hosted (free, zero maintenance, no security risk) |
| Private repo CI for standard stacks | GitHub-hosted (simple, maintained) |
| Need a GPU | Self-hosted (not available on GitHub-hosted) |
| Very large builds (>150 GB disk, >16 GB RAM) | Self-hosted (larger runners available on paid plans) |
| Access to internal network resources | Self-hosted (with network isolation) |
| Compliance requiring specific OS images | Self-hosted (you control the image) |
| High throughput (thousands of jobs/day) | Self-hosted (no concurrency cap) |

[← Back to index](../index.md)
