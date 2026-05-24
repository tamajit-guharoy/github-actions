# actions/checkout

`actions/checkout` is the single most-used action on GitHub. It clones your repository onto the runner so your workflow can access the code. Almost every workflow starts with it.

---

## Basic usage

```yaml
steps:
  - uses: actions/checkout@v4
```

That's it. Checks out the commit that triggered the workflow into `$GITHUB_WORKSPACE` (default: `/home/runner/work/<repo>/<repo>`).

---

## Shallow clone vs full history

By default, `checkout` does a **shallow clone** (only the triggering commit, `fetch-depth: 1`). This is fast and usually sufficient. When you need more history:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0               # full history — needed for git blame, diff, tags
```

Use `fetch-depth: 0` when your workflow:
- Computes diffs between commits
- Uses `git describe --tags`
- Pushes commits (needs history to merge)
- Runs a tool that reads git history (e.g., changeset-based versioning)

---

## Checking out a different ref

```yaml
- uses: actions/checkout@v4
  with:
    ref: develop                 # checkout the 'develop' branch instead of the trigger commit
```

```yaml
- uses: actions/checkout@v4
  with:
    ref: ${{ github.event.pull_request.head.sha }}   # the PR's head commit
```

When checking out a PR from a fork, use `ref` with `persist-credentials: false`:

```yaml
- uses: actions/checkout@v4
  with:
    ref: ${{ github.event.pull_request.head.sha }}
    persist-credentials: false
```

---

## Submodules

```yaml
- uses: actions/checkout@v4
  with:
    submodules: true             # checkout submodules (recursive)
```

```yaml
- uses: actions/checkout@v4
  with:
    submodules: recursive
    token: ${{ secrets.PAT }}    # needed if submodules are in private repos
```

---

## Checking out into a subdirectory (monorepos)

```yaml
- uses: actions/checkout@v4
  with:
    path: ./frontend             # checkout into a subdirectory
```

Useful when you need to check out multiple repos:

```yaml
steps:
  - uses: actions/checkout@v4      # this repo → ./
  - uses: actions/checkout@v4
    with:
      repository: other-org/shared-config
      path: ./shared               # external repo → ./shared/
      token: ${{ secrets.PAT }}
```

---

## Sparse checkout (monorepos with large repos)

Check out only the directories you need:

```yaml
- uses: actions/checkout@v4
  with:
    sparse-checkout: |
      frontend/
      shared/lib/
    sparse-checkout-cone-mode: false
```

This avoids cloning a massive monorepo when you only need a few directories.

---

## Token and authentication

By default, `checkout` uses `${{ secrets.GITHUB_TOKEN }}`. This token:
- Has read access to the current repo
- Has write access if `permissions: contents: write` is set
- Expires when the job completes

Use a personal access token (PAT) when you need to trigger further workflows from a push:

```yaml
- uses: actions/checkout@v4
  with:
    token: ${{ secrets.PAT }}
```

Why a PAT? Pushes made with `GITHUB_TOKEN` do **not** trigger new workflow runs (to prevent infinite loops). A PAT bypasses this restriction.

---

## All parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `repository` | Current repo | `owner/repo` to checkout |
| `ref` | Trigger commit | Git ref (branch, tag, SHA) |
| `token` | `GITHUB_TOKEN` | Auth token |
| `fetch-depth` | `1` | Commits to fetch (`0` = all) |
| `fetch-tags` | `false` if `fetch-depth > 0` | Whether to fetch tags |
| `lfs` | `false` | Whether to fetch Git LFS files |
| `submodules` | `false` | `true` or `recursive` |
| `path` | `$GITHUB_WORKSPACE` | Directory to clone into |
| `sparse-checkout` | | Directories to include (one per line) |
| `persist-credentials` | `true` | Whether to leave the token in git config |
| `clean` | `true` | `git clean -ffdx` before checkout |
| `ssh-key` | | SSH private key for auth |
| `ssh-known-hosts` | | SSH known_hosts entry |
| `show-progress` | `true` | Show progress in logs |

---

## Common patterns

### Checkout with full history for versioning

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
    fetch-tags: true
```

### Checkout PR head (not merge commit)

```yaml
- uses: actions/checkout@v4
  with:
    ref: ${{ github.event.pull_request.head.sha }}
```

### Checkout multiple repos

```yaml
steps:
  - uses: actions/checkout@v4

  - uses: actions/checkout@v4
    with:
      repository: my-org/shared-scripts
      path: .github/shared-scripts
      token: ${{ secrets.ORG_PAT }}
```

### Checkout with LFS

```yaml
- uses: actions/checkout@v4
  with:
    lfs: true
```

---

## What happens under the hood

`actions/checkout@v4` does approximately:

```bash
git init
git remote add origin https://github.com/<owner>/<repo>
git fetch --no-tags --depth=1 origin <ref>
git checkout FETCH_HEAD
git log -1  # verify the checkout
```

[← Back to index](../index.md)
