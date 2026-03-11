#!/bin/bash
# Blocks destructive git commands for the reviewer agent.
# Allows: git diff, git log, git show, git status, git branch, git ls-tree, git ls-files
# Allows: all non-git commands (tests, linters, etc.)
# Blocks: git reset, git clean, git checkout, git push, git commit, git rebase,
#         git merge, git stash, git tag, git pull, git fetch, git add, git rm, git mv

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Only inspect git commands
if ! echo "$COMMAND" | grep -qE '\bgit\b'; then
  exit 0
fi

# Block destructive git operations
if echo "$COMMAND" | grep -qE '\bgit\s+(reset|clean|checkout|push|commit|rebase|merge|stash|tag|pull|fetch|add|rm|mv)\b'; then
  echo "Blocked: Reviewer may only use read-only git commands (diff, log, show, status, branch)." >&2
  exit 2
fi

exit 0
