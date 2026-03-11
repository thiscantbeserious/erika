#!/bin/bash
# Blocks Write tool calls to paths outside .state/
# Used by story-writer, product-owner, architect to restrict file creation.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Canonicalize to prevent ../ traversal bypasses
RESOLVED=$(realpath -m "$FILE_PATH")

if echo "$RESOLVED" | grep -qE '(^|/)\.state/'; then
  exit 0
fi

echo "Blocked: Write is restricted to .state/ directories." >&2
exit 2
