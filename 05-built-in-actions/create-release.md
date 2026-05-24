# Creating Releases

There's no single official "create release" action — the original `actions/create-release` was archived. Instead, GitHub Actions provides multiple ways to create releases, each suited to different needs.

---

## softprops/action-gh-release (recommended)

The de facto standard for creating GitHub Releases:

```yaml
on:
  push:
    tags: ['v*']                      # run only on version tags

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write                 # needed to create the release
    steps:
      - uses: actions/checkout@v4

      - uses: softprops/action-gh-release@v2
        with:
          name: Release ${{ github.ref_name }}
          body: |
            ## Changes
            - Feature A
            - Bug fix B
          files: |
            dist/*.tar.gz
            dist/*.zip
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Key parameters

| Parameter | Description |
|-----------|-------------|
| `name` | Release title (default: tag name) |
| `body` | Release notes (markdown) |
| `body_path` | Path to a file containing release notes |
| `files` | Assets to attach (glob patterns) |
| `draft` | Create as draft (not published) |
| `prerelease` | Mark as pre-release |
| `tag_name` | Override the tag (default: `github.ref_name`) |
| `target_commitish` | Commit to tag (default: the tag's commit) |
| `discussion_category_name` | Announce in GitHub Discussions |
| `generate_release_notes` | Auto-generate notes from merged PRs |
| `append_body` | Append to auto-generated notes instead of replacing |
| `make_latest` | Set as the "latest" release (`true`, `false`, or `legacy`) |

### Auto-generated release notes

```yaml
- uses: softprops/action-gh-release@v2
  with:
    generate_release_notes: true       # GitHub auto-generates from merged PRs
    files: dist/*
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This populates the release body with PR titles and contributor names — no manual changelog needed.

### Custom release notes from a file

```yaml
- uses: softprops/action-gh-release@v2
  with:
    body_path: CHANGELOG.md
    files: dist/*
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## GitHub CLI (`gh release create`)

A script-based approach using the `gh` CLI (preinstalled on all runners):

```yaml
jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Create release
        run: |
          gh release create ${{ github.ref_name }} \
            --title "${{ github.ref_name }}" \
            --notes "Release ${{ github.ref_name }}" \
            dist/*
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The `gh` CLI gives you full control — generate notes from any source, attach any files, set discussion categories.

---

## ncipollo/release-action (alternative)

Another popular release action with more options:

```yaml
- uses: ncipollo/release-action@v1
  with:
    artifacts: "dist/*.tar.gz,dist/*.zip"
    body: "Release notes here"
    token: ${{ secrets.GITHUB_TOKEN }}
    commit: main
    tag: v1.0.0
    draft: true
```

Useful when you want to create both the **tag and the release** in one step (most actions require the tag to already exist).

---

## Full release workflow (build + release)

```yaml
name: Build and Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm pack                        # creates my-app-1.2.3.tgz
      - uses: actions/upload-artifact@v4
        with:
          name: package
          path: '*.tgz'

  release:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: package
      - uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
          files: '*.tgz'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Release to other registries

### npm

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    registry-url: 'https://registry.npmjs.org'
- run: npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Docker Hub

```yaml
- uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
- uses: docker/build-push-action@v6
  with:
    push: true
    tags: user/app:${{ github.ref_name }}
```

See the full [Docker example](../examples/docker-app/.github/workflows/docker-build-push.yml).

### GitHub Packages

```yaml
- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
- uses: docker/build-push-action@v6
  with:
    push: true
    tags: ghcr.io/${{ github.repository }}:${{ github.ref_name }}
```

---

## Choosing the right approach

| You want to | Use |
|-------------|-----|
| Create a simple release with assets | `softprops/action-gh-release@v2` |
| Create both tag + release | `ncipollo/release-action@v1` |
| Full scripting control | `gh release create` |
| Publish to a language registry | npm/pip/cargo publish |
| Publish a Docker image | `docker/build-push-action@v6` |

[← Back to index](../index.md)
