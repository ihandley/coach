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

REPO_URL=$(git remote get-url origin 2>/dev/null | sed -E 's/git@github.com:/https:\/\/github.com\//' | sed -E 's/\.git$//')

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

ISSUE_PATH=""
if [[ -n "$ISSUE_FILE" ]]; then
  ISSUE_PATH=".ai/issues/$ISSUE_FILE"
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
PR_STATUS_NOTE=""

if command -v gh >/dev/null 2>&1; then
  echo "Checking for existing PR..."

  EXISTING_PR=$(gh pr list --head "$BRANCH_NAME" --json url --jq '.[0].url' || true)

  if [[ -n "$EXISTING_PR" && "$EXISTING_PR" != "null" ]]; then
    PR_URL="$EXISTING_PR"
  else
    echo "Attempting to create draft PR..."

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

    set +e
    PR_CREATE_OUTPUT=$(gh pr create \
      --base main \
      --head "$BRANCH_NAME" \
      --title "$PR_TITLE" \
      --body "$PR_BODY" \
      --draft 2>&1)
    PR_CREATE_EXIT_CODE=$?
    set -e

    if [[ $PR_CREATE_EXIT_CODE -eq 0 ]]; then
      PR_URL="$PR_CREATE_OUTPUT"
    else
      if echo "$PR_CREATE_OUTPUT" | grep -q "No commits between"; then
        PR_STATUS_NOTE="Draft PR not created yet. Create the first checkpoint commit, push, then re-run session-start.sh."
      else
        echo "Warning: failed to create PR"
        echo "$PR_CREATE_OUTPUT"
      fi
    fi
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
echo "Repo:   ${REPO_URL:-"(unknown)"}"
echo "Issue:  #$ISSUE_NUMBER"
echo "Branch: $BRANCH_NAME"
echo "PR:     ${PR_URL:-"(not created yet)"}"

if [[ -n "$ISSUE_PATH" ]]; then
  echo "Issue File: $ISSUE_PATH"
fi

if [[ -n "$PR_STATUS_NOTE" ]]; then
  echo "Note:   $PR_STATUS_NOTE"
fi

echo ""

if [[ -n "$ISSUE_PATH" && -f "$ISSUE_PATH" ]]; then
  echo "----------------------------------------"
  echo "ISSUE CONTENT"
  echo "----------------------------------------"
  sed -n '1,200p' "$ISSUE_PATH"
  echo ""
fi

echo "You can begin work."