#!/bin/sh -l

# =============================================================================
# Docker Action Entrypoint
# =============================================================================
# Inputs arrive in two ways:
#   1. As positional arguments from action.yml → args: ($1, $2, $3)
#   2. As environment variables with INPUT_ prefix (INPUT_SOURCE, etc.)
#
# The workspace ($GITHUB_WORKSPACE) is mounted at /github/workspace.
# =============================================================================

SOURCE="$1"
OUTPUT="$2"
TITLE="$3"

echo "== Markdown to HTML Converter =="
echo "Source pattern: $SOURCE"
echo "Output file:    $OUTPUT"
echo "Title:          $TITLE"
echo "Workspace:      $GITHUB_WORKSPACE"

# Change to the workspace directory
cd "$GITHUB_WORKSPACE" || exit 1

# List matching files
echo ""
echo "Matching files:"
ls $SOURCE 2>/dev/null || echo "  (none found with pattern: $SOURCE)"

# Combine all matching Markdown files and convert with Pandoc
# --standalone produces a complete HTML document
# --metadata sets the <title>
cat $SOURCE 2>/dev/null | pandoc --from markdown --to html5 --standalone --metadata title="$TITLE" -o "$OUTPUT"

if [ -f "$OUTPUT" ]; then
  SIZE=$(wc -c < "$OUTPUT")
  echo ""
  echo "Generated $OUTPUT ($SIZE bytes)"
  # Set the output for downstream steps
  echo "html-path=$OUTPUT" >> "$GITHUB_OUTPUT"
else
  echo "Error: failed to generate $OUTPUT"
  exit 1
fi
