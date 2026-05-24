# Publishing to GitHub Marketplace

The GitHub Marketplace is where users discover and install actions. Publishing there makes your action visible to millions of developers and integrates it into GitHub's action search.

---

## Prerequisites

Before publishing, your action repo must have:

- ✅ A valid `action.yml` at the root
- ✅ A descriptive `README.md`
- ✅ A permissive open-source license (`LICENSE` file)
- ✅ The action is public (not a private repo)
- ✅ A unique name (repo name = action name in Marketplace)

---

## README requirements

The README is the most important file for Marketplace. It's what users see when they discover your action.

### Required sections

```markdown
# Action Name

Brief one-line description (shown in search results).

## Description

What does this action do? What problem does it solve? Include a
screenshot or diagram if helpful.

## Inputs

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `name` | ✅ | `World` | Who to greet |

## Outputs

| Name | Description |
|------|-------------|
| `time` | The time the greeting was recorded |

## Example usage

```yaml
steps:
  - uses: owner/action-name@v1
    with:
      name: 'GitHub User'
```

## License

MIT — see [LICENSE](LICENSE).
```

### Branding (optional but recommended)

Add a `branding:` section to `action.yml`:

```yaml
branding:
  icon: 'heart'       # Feather icons: https://feathericons.com
  color: 'red'        # white, yellow, blue, green, orange, red, purple, gray-dark
```

The icon and color appear next to the action name in Marketplace search results and in the workflow editor.

---

## Publishing the release

Actions are versioned via **git tags** and **GitHub Releases**. To publish:

### Step 1: Create a release

Push a tag in semver format and create a Release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Then, on GitHub: **Releases → Draft a new release → Choose the v1.0.0 tag → Publish release**.

### Step 2: Check "Publish to Marketplace"

At the bottom of the release form, check:

```
☑ Publish this Action to the GitHub Marketplace
```

This checkbox only appears if the repo has a valid `action.yml` at the root. Once checked and published, the action is listed in the Marketplace.

---

## Release checklist

- [ ] `action.yml` has `name:`, `description:`, `author:`, `inputs:`, `outputs:`, `runs:`
- [ ] README has inputs/outputs tables and an example usage section
- [ ] LICENSE file exists at repo root
- [ ] Git tag matches semver (`v1.0.0`)
- [ ] Release notes describe the changes
- [ ] "Publish to Marketplace" is checked
- [ ] Action works when consumed as `owner/repo@v1.0.0`

---

## Categories and search

Marketplace actions are categorized. Choose the best-fit category in your repo settings or release form:

- **Build** — compilation, bundling, transpilation
- **Test** — testing frameworks, coverage, quality gates
- **Deploy** — cloud providers, static hosting, containers
- **Security** — SAST, dependency scanning, secret detection
- **Utilities** — notifications, formatting, file operations
- **Code review** — PR workflows, labelers, auto-assign
- **Dependency management** — updates, license checks
- **Chat** — Slack, Discord, Teams integrations
- **Mobile** — iOS/Android build and deploy

Users find your action by search, category browsing, or when the workflow editor suggests actions based on `name:` and `description:`.

---

## Transferring vs creating from scratch

If you've been developing the action in a personal repo, you can transfer it to an organization for more visibility and shared maintenance:

**Repo → Settings → General → Transfer ownership**

The Marketplace listing follows the transfer. Update any in-progress PRs or discussions.

---

## Updates and deprecation

### Releasing a new version

Push a new tag and create a new Release. The "Publish to Marketplace" checkbox remembers the previous setting.

### Deprecating an action

To deprecate an old version or the entire action:

1. Edit the release → uncheck "Publish" (removes that version only)
2. Or add a deprecation notice to README:

```markdown
## ⚠️ Deprecated

This action is deprecated in favor of [my-org/better-action](https://github.com/my-org/better-action).
No new features will be added. Existing workflows will continue to work.
```

3. Archive the repo when no longer needed:

> **Repo → Settings → General → Archive repository**

Archived repos remain downloadable but workflows using them will see a warning.

---

## Verified creator badge

Organizations that publish widely-used actions can apply for the **verified creator** badge:

```
✅ Verified creator
```

Requirements:
- The action is published from an organization account
- The org has a verified domain
- The org has a public profile with a logo/banner
- The action has significant adoption

Apply at: [github.com/marketplace/actions](https://github.com/marketplace/actions) → "Become a verified creator"

The badge shows on the Marketplace listing and in the workflow editor, giving users confidence in the action's authenticity.

---

## Key takeaways

1. **`action.yml` + `README.md` + `LICENSE`** are the three required files
2. **Publishing is per Release** — create a Release with the "Publish to Marketplace" checkbox
3. **Version with semver tags** — `v1.0.0`, `v1.1.0`, etc.
4. **Branding helps discovery** — an icon and color make your action stand out in search
5. **Marketplace is automatic** — no separate submission, just check the box on the release form

[← Back to index](../index.md)
