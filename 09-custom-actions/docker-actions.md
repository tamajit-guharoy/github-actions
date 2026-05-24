# Docker Container Actions

A Docker container action packages your logic in a Docker image. It runs in an isolated container on the runner, with the full power of any language, library, or tool available inside the image.

---

## When to use a Docker action

- You need a language or toolchain not preinstalled on GitHub runners
- Your action requires system packages (`apt`, `yum`, `apk`)
- You have complex runtime dependencies (compilers, native libraries, GPU drivers)
- You want a reproducible environment defined entirely by a Dockerfile

Use a **JavaScript action** when you can — it's faster (no image pull) and cross-platform without Docker.

---

## Project structure

```
my-docker-action/
├── action.yml              ← required
├── Dockerfile              ← defines the container
├── entrypoint.sh           ← what runs when the action is invoked
├── src/                    ← your application code (any language)
│   └── main.py
├── requirements.txt
└── README.md
```

---

## action.yml

```yaml
name: 'Python Script Action'
description: 'Run a Python script with dependencies'
author: 'Your Name'

inputs:
  text:
    description: 'Text to process'
    required: true
    default: 'Hello, world!'
  repeat:
    description: 'Number of repetitions'
    required: false
    default: '1'

outputs:
  result:
    description: 'The processed text'

runs:
  using: 'docker'
  image: 'Dockerfile'           # build from Dockerfile in the repo
  # image: 'docker://ghcr.io/owner/image:v1'  # or pull a pre-built image
  args:
    - ${{ inputs.text }}
    - ${{ inputs.repeat }}
```

### `image:` options

| Value | Behavior |
|-------|----------|
| `Dockerfile` | Build from the `Dockerfile` in the action's root |
| `docker://ghcr.io/owner/image:v1` | Pull a pre-built image from a registry |
| `docker://alpine:3.19` | Pull from Docker Hub |

---

## Dockerfile

```dockerfile
# Use a small base image
FROM python:3.12-alpine

# Install system dependencies
RUN apk add --no-cache curl

# Copy the action code
COPY entrypoint.sh /entrypoint.sh
COPY src/ /src/
COPY requirements.txt /

# Install Python dependencies
RUN pip install -r /requirements.txt

# entrypoint.sh receives the inputs as arguments
ENTRYPOINT ["/entrypoint.sh"]
```

---

## entrypoint.sh

```bash
#!/bin/sh -l

# Inputs arrive as positional arguments (from action.yml → args:)
TEXT=$1
REPEAT=$2

echo "Processing: $TEXT"
echo "Repeating $REPEAT time(s)"

# Run the actual logic
result=$(python /src/main.py "$TEXT" "$REPEAT")
echo "Result: $result"

# Set the output — GitHub reads stdout in a specific format
echo "result=$result" >> $GITHUB_OUTPUT
```

```python
# src/main.py
import sys

text = sys.argv[1]
repeat = int(sys.argv[2])

result = (text + ' ') * repeat
print(result.strip())
```

---

## Passing inputs

Inputs are passed to the container in **two ways** simultaneously:

### 1. As arguments (positional)

```yaml
# action.yml
inputs:
  text:
    required: true
  repeat:
    required: false
    default: '1'

runs:
  using: 'docker'
  image: 'Dockerfile'
  args:
    - ${{ inputs.text }}
    - ${{ inputs.repeat }}
```

The container receives them as `$1`, `$2` in the `ENTRYPOINT`.

### 2. As environment variables (automatic)

Every input is also set as an environment variable with the prefix `INPUT_` and uppercase, hyphens-to-underscores:

```bash
echo $INPUT_TEXT          # → "Hello, world!"    (from inputs.text)
echo $INPUT_REPEAT        # → "1"                 (from inputs.repeat)
```

You don't need to declare these — they're always set. This is the easiest way to access inputs in your script:

```python
import os
text = os.environ['INPUT_TEXT']
repeat = int(os.environ.get('INPUT_REPEAT', '1'))
```

---

## Setting outputs

Outputs work the same as in any workflow step — write to `$GITHUB_OUTPUT`:

```bash
echo "result=The processed output" >> $GITHUB_OUTPUT
```

Or from Python:

```python
import os
output_file = os.environ['GITHUB_OUTPUT']
with open(output_file, 'a') as f:
    f.write(f"result=The processed output\n")
```

---

## Accessing the workspace

The runner's workspace is mounted at `/github/workspace` inside the container:

```yaml
# action.yml
runs:
  using: 'docker'
  image: 'Dockerfile'
  args:
    - ${{ inputs.text }}
    - /github/workspace          # pass the workspace path
```

```python
import sys
workspace = sys.argv[2]
# Process files in the workspace
for file in os.listdir(workspace):
    print(f"Found: {file}")
```

---

## Using pre-built images

Building from a `Dockerfile` on every run adds ~30–60 seconds (image build time). For faster startup, pre-build the image and pull it:

```yaml
runs:
  using: 'docker'
  image: 'docker://ghcr.io/my-org/my-action:v1.0.0'
  args:
    - ${{ inputs.text }}
```

Build and push the image in a separate workflow:

```yaml
# .github/workflows/publish-action.yml
on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ghcr.io/my-org/my-action:${{ github.ref_name }}
```

---

## Docker action vs JavaScript action

| | Docker Action | JavaScript Action |
|---|---|---|
| Startup time | Slower (image pull/build) | Fast (~1s) |
| Cross-platform | Linux only | Any runner |
| Language support | Any language | JavaScript/TypeScript only |
| System dependencies | Full OS (apt, apk, etc.) | None |
| Image size | Can be large (100+ MB) | Small (~1 MB bundled) |
| Best for | Tools requiring native deps, non-JS languages | API calls, simple logic, platform-neutral tasks |

---

## Complete example: PDF generator action

```yaml
# action.yml
name: 'PDF Generator'
description: 'Generate a PDF from Markdown files'
inputs:
  source-dir:
    description: 'Directory of Markdown files'
    required: true
  output:
    description: 'Output PDF filename'
    required: false
    default: 'output.pdf'
outputs:
  pdf-path:
    description: 'Path to the generated PDF'
runs:
  using: 'docker'
  image: 'Dockerfile'
  args:
    - ${{ inputs.source-dir }}
    - ${{ inputs.output }}
```

```dockerfile
FROM pandoc/latex:latest
RUN apk add --no-cache make
COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

```bash
#!/bin/sh -l
SOURCE_DIR=$1
OUTPUT=$2

cd /github/workspace/$SOURCE_DIR

# Combine all markdown files and convert to PDF
cat *.md > combined.md
pandoc combined.md -o /github/workspace/$OUTPUT --pdf-engine=xelatex

echo "pdf-path=$OUTPUT" >> $GITHUB_OUTPUT
```

---

## Key takeaways

1. **Use Docker when you need native dependencies** — otherwise prefer JavaScript
2. **Inputs are automatic env vars** (`INPUT_*`) — no manual argument parsing needed
3. **Pre-build images for speed** — `docker://ghcr.io/...` instead of `Dockerfile`
4. **Workspace is at `/github/workspace`** — actions/checkout clones there
5. **Outputs use `$GITHUB_OUTPUT`** — same mechanism as any step

[← Back to index](../index.md)
