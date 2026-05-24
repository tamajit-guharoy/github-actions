# Pricing & Limits

## Free tier (included with every GitHub account)

| Plan | Included minutes | Runners |
|------|-----------------|---------|
| Public repos | **Unlimited** | Linux, Windows, macOS |
| Private repos (Free) | 2,000 min/month | Linux, Windows |
| Private repos (Team) | 3,000 min/month | Linux, Windows |
| Enterprise | 50,000 min/month | Linux, Windows, macOS |

Minutes are multiplied on non-Linux runners:
- **Windows** consumes 2× minutes
- **macOS** consumes 10× minutes (Intel) or 4× (Apple Silicon)

## Paid (beyond free limits)

You're billed per-minute at the [current rates](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions). You can set spending limits per account.

## Hard limits per workflow

| Resource | Limit |
|----------|-------|
| Jobs per workflow run | 20 |
| Concurrent jobs (free) | 20 |
| Workflow run timeout | 35 days |
| Job timeout | 24 hours |
| Matrix combinations | 256 |
| Artifact retention | 90 days |

## Self-hosted runners

Self-hosted runners have **no minute limits** and no per-minute cost — you provide the compute. They're free for both public and private repos.

---

[← Back to index](../index.md)
