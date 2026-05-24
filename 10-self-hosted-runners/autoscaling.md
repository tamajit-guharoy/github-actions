# Autoscaling Runners

Autoscaling dynamically adds and removes self-hosted runners based on demand. When a queue of pending jobs forms, new runners spin up. When idle, they're terminated. This minimizes cost while ensuring jobs don't wait.

---

## Why autoscale?

Without autoscaling, you either:
- **Over-provision**: runners sit idle most of the time, wasting money
- **Under-provision**: developers wait minutes for a runner to free up

Autoscaling lets you pay for runners only when jobs are queued. A burst of 20 PRs spins up 20 ephemeral runners, all destroyed within minutes of completion.

---

## Actions Runner Controller (ARC)

ARC is the official Kubernetes operator for autoscaling GitHub Actions runners. It's the recommended approach for most teams already using Kubernetes.

### Architecture

```
GitHub Actions Queue
        │
        ▼
  ARC Controller  ← watches for pending jobs
        │
        ├── Creates EphemeralRunner pods
        │         │
        │         ├── Runner Pod 1 → Accepts job → Completes → Terminates
        │         ├── Runner Pod 2 → Accepts job → Completes → Terminates
        │         └── Runner Pod 3 → Accepts job → Completes → Terminates
        │
        └── Autoscaler (HPA or KEDA)
                  │
                  Scales pod count based on: pending jobs, queue depth, or schedule
```

### Quick setup (Helm)

```bash
# Add the ARC Helm repository
helm repo add actions-runner-controller https://actions-runner-controller.github.io/actions-runner-controller
helm repo update

# Install the controller
helm upgrade --install arc \
  actions-runner-controller/actions-runner-controller \
  --namespace arc-system \
  --create-namespace \
  --set authSecret.github_token="$GITHUB_TOKEN"

# Create a runner scale set
cat <<EOF | kubectl apply -f -
apiVersion: actions.github.com/v1alpha1
kind: EphemeralRunnerSet
metadata:
  name: my-runners
  namespace: arc-system
spec:
  repository: owner/repo
  runnerScaleSetName: my-scale-set
  minRunners: 0
  maxRunners: 20
  ephemeral: true
EOF
```

---

## Autoscaling approaches

### Reactive: scale on pending jobs

All runners are idle → scale to 0. A job arrives → ARC creates a runner pod. If 10 more jobs queue → ARC creates 10 more pods (up to `maxRunners`).

```yaml
spec:
  minRunners: 0
  maxRunners: 20
```

Best for cost-sensitive workloads where a 30-second spin-up delay is acceptable.

### Proactive: keep warm runners

```yaml
spec:
  minRunners: 2           # always keep 2 runners ready
  maxRunners: 20
```

Two runners are always idle, ready to accept jobs instantly. A job starts immediately — no pod creation delay. The cost is 2 idle runners × their runtime.

Best for latency-sensitive workflows where every second matters (CI on main, deployment gates).

### Scheduled: scale based on time of day

Using KEDA or CronJobs, scale up before business hours, scale down overnight:

```yaml
# KEDA ScaledObject
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: runner-scaler
spec:
  scaleTargetRef:
    name: my-scale-set
  triggers:
    - type: cron
      metadata:
        timezone: America/New_York
        start: "30 8 * * 1-5"       # 8:30 AM weekdays
        end: "0 19 * * 1-5"         # 7:00 PM weekdays
        desiredReplicas: "5"
```

Best for teams in a single timezone with predictable busy hours.

---

## Runner images

### Default image

ARC uses the official `ghcr.io/actions/actions-runner` image. It's a minimal Linux container with the runner application only.

### Custom images

Add tools to reduce job time (pre-warm caches, preinstall language runtimes):

```dockerfile
FROM ghcr.io/actions/actions-runner:latest

# Preinstall Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Pre-warm npm cache (optional)
RUN npm install -g typescript eslint

# Install Docker CLI (for building containers)
RUN curl -fsSL https://get.docker.com -o get-docker.sh \
    && sh get-docker.sh
```

Build and push this image, then reference it in your `EphemeralRunnerSet`:

```yaml
spec:
  image: ghcr.io/my-org/my-runner-image:v1
```

---

## Cost optimization

### Spot / preemptible instances

Run ARC on spot instances (AWS Spot, GCP Preemptible, Azure Spot VMs). Spot instances cost 60–90% less. If an instance is reclaimed mid-job, ARC retries the job on a new instance.

```yaml
# AWS EKS managed node group
apiVersion: eks.amazonaws.com/v1
kind: NodeGroup
spec:
  capacityType: SPOT
```

Always combine spot instances with ephemeral runners and short timeouts:

```yaml
jobs:
  build:
    runs-on: [self-hosted, spot]
    timeout-minutes: 15           # spot may be reclaimed after this
```

### Right-size runner pods

Don't provision 16 GB RAM if your builds use 2 GB. Set resource requests:

```yaml
spec:
  containers:
    - name: runner
      resources:
        requests:
          cpu: "2"
          memory: "4Gi"
        limits:
          cpu: "4"
          memory: "8Gi"
```

The Kubernetes scheduler packs pods more densely, and you need fewer nodes.

### Scale to zero overnight

```yaml
spec:
  minRunners: 0
```

Combined with scheduled scaling, non-business hours cost nothing.

---

## Non-Kubernetes autoscaling

### AWS Auto Scaling Groups

```
Launch Template (pre-configured AMI with runner installed)
       │
Auto Scaling Group  ←  scales based on queue metrics
       │
EC2 instances run ephemeral runners
```

Use a custom metric (CloudWatch) that polls the GitHub API for pending workflow jobs. Scale up when pending > 0, scale down when pending = 0 for N minutes.

### GCP Managed Instance Groups

Same pattern with GCE instances. Use Cloud Monitoring metrics and a Cloud Function that calls the GitHub Actions API to count queued jobs.

### On-premise / VMware

Use your existing VM infrastructure. A polling script on a management VM:

```bash
#!/bin/bash
# Check pending jobs and spin up VMs accordingly
PENDING=$(gh api repos/owner/repo/actions/runs --jq '.workflow_runs[] | select(.status=="queued") | .id' | wc -l)

if [ "$PENDING" -gt 0 ]; then
  # Power on idle VMs or clone from template
  vsphere-clone-vm --template runner-template --count "$PENDING"
fi
```

For most teams, ARC on Kubernetes is simpler. Only build custom autoscalers if you have specific infrastructure constraints.

---

## Key takeaways

1. **Use ARC (Actions Runner Controller)** — the official Kubernetes operator, not a DIY solution
2. **Ephemeral runners only** — `ephemeral: true` eliminates all cross-job contamination
3. **`minRunners: 0` + spot instances** — pay for compute only when jobs are queued
4. **Prebuilt images** reduce job time — preinstall toolchains in a custom runner image
5. **Scheduled scaling** handles predictable demand (business hours) better than reactive alone

[← Back to index](../index.md)
