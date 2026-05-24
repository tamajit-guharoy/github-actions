# Docker Container Action Example — Markdown to HTML

A Docker container action that converts Markdown files to HTML using Pandoc. Demonstrates packaging a tool (Pandoc) as a reusable action without requiring consumers to install anything.

## Structure

```
.
├── action.yml              ← Action metadata (inputs, outputs, runs: docker)
├── Dockerfile              ← Container image definition (pandoc/latex)
├── entrypoint.sh           ← The script that runs inside the container
├── .github/workflows/
│   └── test.yml            ← Self-test (converts README.md to HTML)
└── README.md
```

## How it works

```
GitHub Actions Runner
  │
  ├── Builds Docker image from Dockerfile (or pulls pre-built)
  ├── Starts container with /github/workspace mounted
  ├── Passes inputs as arguments (positional) AND env vars (INPUT_*)
  ├── entrypoint.sh runs inside the container
  │     ├── cd /github/workspace
  │     ├── cat *.md | pandoc → output.html
  │     └── echo "html-path=output.html" >> $GITHUB_OUTPUT
  └── Container stops, action outputs are available to next steps
```

## Key concepts

| Concept | Where to look |
|---------|--------------|
| `runs: using: 'docker'` | `action.yml` line 32 |
| `image: 'Dockerfile'` (build from source) | `action.yml` line 33 |
| Inputs as positional args (`args:`) | `action.yml` lines 34-37 |
| Inputs auto-exposed as `INPUT_*` env vars | `entrypoint.sh` comments |
| `/github/workspace` mount | `entrypoint.sh` line 20 |
| Writing outputs via `$GITHUB_OUTPUT` | `entrypoint.sh` line 34 |
| Consuming action outputs (`steps.convert.outputs.*`) | `test.yml` line 27 |

## Using a pre-built image

To avoid building the Docker image on every run (slower), publish it to a registry first:

```yaml
# action.yml
runs:
  using: 'docker'
  image: 'docker://ghcr.io/my-org/md-to-html:v1'    # Pre-built, faster
  args:
    - ${{ inputs.source }}
    - ${{ inputs.output }}
    - ${{ inputs.title }}
```

## Docker action vs JavaScript action

| | Docker Action | JavaScript Action |
|---|---|---|
| Startup | Slower (build or pull image) | Fast (~1s) |
| Platform | Linux only | Cross-platform |
| Languages | Any (Python, Ruby, Go, etc.) | JavaScript/TypeScript |
| System deps | Full OS (`apt`, `apk`, etc.) | None |
| Image size | Can be large (100 MB+) | Small (~1 MB bundled) |

Use Docker when you need native tools (Pandoc, LaTeX, ImageMagick, ffmpeg). Use JavaScript for API calls and workflow logic.
