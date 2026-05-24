# Versioning & Releases for Custom Actions

Actions are consumed by reference: `owner/repo@<ref>`. The `<ref>` is how users pin to your version. Getting versioning right is the difference between "your action broke my CI" and "smooth upgrade."

---

## How consumers reference your action

```yaml
steps:
  - uses: owner/my-action@v1           # major version tag (floating)
  - uses: owner/my-action@v1.2         # minor version tag (floating)
  - uses: owner/my-action@v1.2.3       # exact version tag (pinned)
  - uses: owner/my-action@a1b2c3d      # commit SHA (immutable)
```

Each has tradeoffs for both the action author and the consumer.

---

## Version tag strategy

### `v1` — major version tag

```yaml
- uses: owner/my-action@v1             # always get the latest v1.x.x
```

When you release `v1.1.0`, users on `@v1` get it automatically. When you release `v2.0.0`, they don't — `v1` stays on `v1.x.x`.

**How to maintain it:** After every release, force-push the tag or delete and recreate it:

```bash
# Option A: Delete and recreate
git tag -d v1
git push origin :refs/tags/v1
git tag v1
git push origin v1

# Option B: Force push (shorter)
git tag -f v1
git push origin v1 --force
```

The `v1` tag always points to the latest `v1.x.x` release. This is the recommended approach for most actions.

### `v1.2` — minor version tag

Moves with minor releases. Users get patch updates automatically but not minor bumps:

```bash
git tag -f v1.2
git push origin v1.2 --force
```

### `v1.2.3` — exact version (immutable)

Never moves. Users who pin to `@v1.2.3` get exactly that version forever. Good for security-sensitive repos.

---

## Release workflow

A typical release process:

```
1. Make changes on a feature branch
2. Merge to main
3. Decide on new version (semver)
4. Tag main: git tag v1.2.0
5. Push the tag: git push origin v1.2.0
6. Create a GitHub Release from the tag
7. Update the floating major tag: git tag -f v1 && git push origin v1 --force
```

### Automating the release

Use a workflow to create releases and move tags:

```yaml
name: Release Action

on:
  push:
    tags: ['v*.*.*']                        # exact versions only

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - name: Extract semver
        id: semver
        run: |
          TAG=${{ github.ref_name }}       # v1.2.3
          MAJOR="${TAG%%.*}"               # v1
          MINOR="${TAG%.*}"                # v1.2
          echo "major=$MAJOR" >> $GITHUB_OUTPUT
          echo "minor=$MINOR" >> $GITHUB_OUTPUT

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true

      - name: Update major tag
        run: |
          git tag -f ${{ steps.semver.outputs.major }}
          git push origin ${{ steps.semver.outputs.major }} --force

      - name: Update minor tag
        run: |
          git tag -f ${{ steps.semver.outputs.minor }}
          git push origin ${{ steps.semver.outputs.minor }} --force
```

Now pushing a `v1.2.3` tag automatically:
1. Creates a GitHub Release with auto-generated notes
2. Moves the `v1` tag to the new release
3. Moves the `v1.2` tag to the new release

---

## Semantic versioning for actions

| Change | Version bump | Consumer impact |
|--------|-------------|-----------------|
| Bug fix (no new inputs, no behavior change) | Patch: `v1.2.3` → `v1.2.4` | Safe auto-upgrade. `@v1.2` and `@v1` both get it. |
| New input, new output, backward-compatible change | Minor: `v1.2.3` → `v1.3.0` | Safe auto-upgrade. `@v1` gets it; `@v1.2` does not. |
| Remove input, rename output, breaking change | Major: `v1.2.3` → `v2.0.0` | NOT auto-upgraded. `@v1` stays on `v1.x.x`. |

### What counts as breaking?

- Removing or renaming an input
- Removing or renaming an output
- Changing the behavior of an existing input
- Dropping support for a `using:` runtime (e.g., dropping `node16`)
- Requiring a new permission
- Minimum runner OS bump (ubuntu-20.04 → ubuntu-22.04)

### What's NOT breaking?

- Adding a new optional input
- Adding a new output
- Fixing a bug where the action didn't work as documented
- Upgrading internal dependencies (same behavior)
- Documentation changes

---

## Maintaining multiple major versions

If `v2` is the current version but `v1` is still in use, you need to keep a `v1` branch:

```
main          → v2 development (current)
v1            → v1 maintenance (critical fixes only)
```

```bash
# When releasing a v2 feature:
git checkout main
git tag v2.1.0
git tag -f v2 && git push origin v2 --force

# When backporting a fix to v1:
git checkout v1
git cherry-pick <fix-commit>
git tag v1.4.1
git tag -f v1 && git push origin v1 --force
```

Users on `@v1` get the fix; users on `@v2` already have it.

---

## Commit SHA pinning (for security)

Some users pin to a full commit SHA for maximum security:

```yaml
- uses: owner/my-action@a1b2c3d4e5f6...40char
```

You don't need to do anything special as an author. Just don't rewrite git history on your release branches. Users who pin to SHAs will not get your updates — they must manually update the SHA.

---

## Deprecation notices

When releasing a new major version, add a deprecation notice to the old version's README:

```markdown
> **⚠️ v1 is deprecated.** Please migrate to [v2](https://github.com/owner/action/releases/tag/v2.0.0).
> v1 will receive critical security fixes until 2026-06-01.

## Migration guide
- `text` input → renamed to `message`
- `output` → now returns an object instead of a string
- Node 16 → Node 20
```

Consumers need:
1. A clear deadline
2. A migration guide (what changed, how to update)
3. A reason (why v2 is better)

---

## Key takeaways

1. **Use semver** — `v1.2.3` format for release tags
2. **Maintain a floating major tag** (`v1`, `v2`) — users expect `@v1` to work
3. **Automate tag management** — a release workflow that updates `v1` and `v1.2` after each release
4. **Major version = breaking change** — removing/renaming inputs, changing behavior, dropping runtimes
5. **Provide a migration guide** with every major version bump

[← Back to index](../index.md)
