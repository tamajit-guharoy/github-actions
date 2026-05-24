# Deploy to GitHub Pages

A zero-cost static site deployment pipeline using GitHub Pages with OIDC authentication. No deploy keys, no PATs, no third-party services — just your Markdown files and a workflow.

Full source: [examples/docker-app/.github/workflows/deploy-github-pages.yml](../examples/docker-app/.github/workflows/deploy-github-pages.yml)

---

## Prerequisites

Enable GitHub Pages in your repo:

**Settings → Pages → Source: GitHub Actions**

This is a one-time setup. After that, any workflow with the right permissions can deploy.

---

## The workflow at a glance

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - '.github/workflows/deploy-pages.yml'

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v4
      - uses: actions/jekyll-build-pages@v1
      - uses: actions/upload-pages-artifact@v3

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## Key components explained

### Path filtering — only deploy when content changes

```yaml
on:
  push:
    paths:
      - 'docs/**'
      - '.github/workflows/deploy-pages.yml'
```

Pushes to `src/`, `tests/`, or `README.md` don't trigger a deploy. Only changes to `docs/` (your site content) or the workflow file itself. This saves runner minutes and avoids pointless deployments.

### Minimal permissions

```yaml
permissions:
  contents: read          # checkout only
  pages: write            # create/update the Pages site
  id-token: write         # OIDC token for trusted deployment
```

The workflow can't modify code, create issues, or access packages. Only what's needed to deploy Pages. `id-token: write` enables OIDC — GitHub issues a short-lived token that `deploy-pages` uses to authenticate. No long-lived secret to manage.

### Concurrency — one deployment at a time

```yaml
concurrency:
  group: pages
  cancel-in-progress: true
```

Pages deployments are strictly serial. If a new commit is pushed while a deploy is in progress, the old one is cancelled — there's no point queuing a stale build.

### Environment with deployment URL

```yaml
environment:
  name: github-pages
  url: ${{ steps.deployment.outputs.page_url }}
```

The `url` creates a clickable link in:
- The Actions run summary ("View deployment")
- The repo's Deployments tab
- Pull request timelines (when the PR includes a pages deploy)

---

## The build pipeline

```
checkout         →  Clone the repo
configure-pages  →  Set base URL, enable Jekyll, read _config.yml
jekyll-build     →  Compile Markdown → HTML into _site/
upload-artifact  →  Package _site/ as a Pages artifact
deploy-pages     →  Deploy the artifact to GitHub's Pages infrastructure
```

This works for Jekyll sites. For other static site generators, replace `jekyll-build-pages` with your build step.

---

## Alternative: non-Jekyll static sites

### Hugo

```yaml
- uses: peaceiris/actions-hugo@v3
  with:
    hugo-version: 'latest'
- run: hugo --minify
- uses: actions/upload-pages-artifact@v3
  with:
    path: ./public
```

### Next.js static export

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
- run: npm ci
- run: npm run build
- uses: actions/upload-pages-artifact@v3
  with:
    path: ./out
```

### Plain HTML/CSS

```yaml
- uses: actions/upload-pages-artifact@v3
  with:
    path: ./docs
```

The deploy step is identical for all generators. Only the build step changes.

---

## Custom domain setup

If you use a custom domain, add a step to create a `CNAME` file:

```yaml
- run: echo "www.example.com" > ./docs/CNAME
- uses: actions/upload-pages-artifact@v3
  with:
    path: ./docs
```

Then configure the domain in **Settings → Pages → Custom domain**. GitHub automatically provisions a TLS certificate via Let's Encrypt.

---

## Debugging failed deployments

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/configure-pages@v4
  - run: cat _config.yml                    # verify config
  - uses: actions/jekyll-build-pages@v1
  - run: ls -la _site/                      # verify output
  - uses: actions/upload-pages-artifact@v3
```

Common failures:
- **No `docs/` directory**: The workflow triggered but there's nothing to build
- **Jekyll build error**: Check `_config.yml` syntax, Markdown frontmatter
- **Permission denied**: Ensure `pages: write` and `id-token: write` are set
- **Source not set to Actions**: Settings → Pages → Source must be "GitHub Actions"

---

## Key takeaways

1. **OIDC eliminates secrets** — no PAT or deploy key needed, ever
2. **Path filtering saves minutes** — don't deploy when documentation hasn't changed
3. **`concurrency` with `cancel-in-progress: true`** — Pages is serial; cancel stale runs
4. **`environment.url`** creates clickable deployment links across GitHub's UI
5. **Any SSG works** — replace Jekyll with Hugo, Next.js, or plain HTML; the deploy step is the same

[← Back to index](../index.md)
