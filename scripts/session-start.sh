#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/session-start.sh <issue_number>
#
# Example:
#   ./scripts/session-start.sh 3

ISSUE_NUMBER="${1:-}"

if [[ -z "$ISSUE_NUMBER" ]]; then
  echo "Error: issue number required"
  echo "Usage: ./scripts/session-start.sh <issue_number>"
  exit 1
fi

# ----------------------------------------
# Ensure git repo
# ----------------------------------------

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: not inside a git repository"
  exit 1
fi

# ----------------------------------------
# Sync main
# ----------------------------------------

echo "Syncing main..."
git checkout main >/dev/null 2>&1 || true
git fetch origin
git pull --ff-only origin main

# ----------------------------------------
# Resolve issue file (optional, for slug)
# ----------------------------------------

ISSUE_FILE=$(ls .ai/issues 2>/dev/null | grep "^$(printf "%04d" "$ISSUE_NUMBER")-" || true)

if [[ -n "$ISSUE_FILE" ]]; then
  SLUG=$(echo "$ISSUE_FILE" | sed -E "s/^[0-9]+-//" | sed -E "s/\.md$//")
else
  SLUG="issue-$ISSUE_NUMBER"
fi

# normalize slug for branch
SLUG=$(echo "$SLUG" | tr '_' '-' | tr '[:upper:]' '[:lower:]')

BRANCH_NAME="feature/issue-$ISSUE_NUMBER-$SLUG"

# ----------------------------------------
# Create or switch branch
# ----------------------------------------

echo "Preparing branch: $BRANCH_NAME"

if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  git checkout "$BRANCH_NAME"
else
  git checkout -b "$BRANCH_NAME"
fi

# ----------------------------------------
# Push branch (ensure remote exists)
# ----------------------------------------

git push -u origin "$BRANCH_NAME" >/dev/null 2>&1 || true

# ----------------------------------------
# Ensure GitHub CLI
# ----------------------------------------

PR_URL=""

if command -v gh >/dev/null 2>&1; then
  echo "Checking for existing PR..."

  EXISTING_PR=$(gh pr list --head "$BRANCH_NAME" --json url --jq '.[0].url' || true)

  if [[ -n "$EXISTING_PR" && "$EXISTING_PR" != "null" ]]; then
    PR_URL="$EXISTING_PR"
  else
    echo "Creating draft PR..."

    PR_TITLE="Issue #$ISSUE_NUMBER: $SLUG"

    PR_BODY=$(cat <<EOF
## Summary

Start work on issue #$ISSUE_NUMBER.

## Scope

See issue #$ISSUE_NUMBER for full requirements.

## Notes

- Work is tracked via commit history
- PR is used for handoff and review

Closes #$ISSUE_NUMBER
EOF
)

    PR_URL=$(gh pr create \
      --title "$PR_TITLE" \
      --body "$PR_BODY" \
      --draft 2>/dev/null || true)
  fi
else
  echo "Warning: GitHub CLI (gh) not found. Skipping PR creation."
fi

# ----------------------------------------
# Output
# ----------------------------------------

echo ""
echo "========================================"
echo "SESSION READY"
echo "========================================"
echo "Issue:  #$ISSUE_NUMBER"
echo "Branch: $BRANCH_NAME"
echo "PR:     ${PR_URL:-"(not created)"}"
echo ""
echo "You can begin work."