#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/session-start.sh <issue_number> [session_name]
#
# Example:
#   ./scripts/session-start.sh 3
#   ./scripts/session-start.sh 3 "issue-3-import-job-url"

ISSUE_NUMBER="${1:-}"
SESSION_NAME_INPUT="${2:-}"

if [[ -z "$ISSUE_NUMBER" ]]; then
  echo "Error: issue number required"
  echo "Usage: ./scripts/session-start.sh <issue_number> [session_name]"
  exit 1
fi

if ! [[ "$ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
  echo "Error: issue number must be numeric"
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: not inside a git repository"
  exit 1
fi

if [[ ! -d ".ai/issues" ]]; then
  echo "Error: .ai/issues directory not found"
  exit 1
fi

PADDED_ISSUE_NUMBER="$(printf "%04d" "$ISSUE_NUMBER")"

shopt -s nullglob
matches=(.ai/issues/"${PADDED_ISSUE_NUMBER}"-*.md)
shopt -u nullglob

if [[ ${#matches[@]} -eq 0 ]]; then
  echo "Error: could not find issue file for #$ISSUE_NUMBER"
  exit 1
fi

if [[ ${#matches[@]} -gt 1 ]]; then
  echo "Error: multiple issue files found for #$ISSUE_NUMBER"
  printf ' - %s\n' "${matches[@]}"
  exit 1
fi

ISSUE_PATH="${matches[0]}"
ISSUE_FILE="$(basename "$ISSUE_PATH")"

SLUG="$(echo "$ISSUE_FILE" | sed -E 's/^[0-9]+-//' | sed -E 's/\.md$//')"
SLUG_CLEAN="$(echo "$SLUG" \
  | tr '[:upper:]' '[:lower:]' \
  | sed -E 's/[^a-z0-9._-]+/-/g' \
  | sed -E 's/-+/-/g' \
  | sed -E 's/^-|-$//g')"

BRANCH_NAME="feature/issue-${ISSUE_NUMBER}-${SLUG_CLEAN}"

if [[ -n "$SESSION_NAME_INPUT" ]]; then
  SESSION_NAME="$(echo "$SESSION_NAME_INPUT" \
    | sed -E 's/[^a-zA-Z0-9._-]+/-/g' \
    | sed -E 's/-+/-/g' \
    | sed -E 's/^-|-$//g')"
else
  SHORT="$(echo "$SLUG_CLEAN" | cut -d'-' -f1-5)"
  SESSION_NAME="issue-${ISSUE_NUMBER}-${SHORT}"
fi

if [[ -z "$SESSION_NAME" ]]; then
  SESSION_NAME="issue-${ISSUE_NUMBER}"
fi

# ----------------------------------------
# Sync main first
# ----------------------------------------

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if git remote get-url origin >/dev/null 2>&1; then
  git fetch origin

  if git show-ref --verify --quiet refs/heads/main; then
    git checkout main
  else
    git checkout -b main --track origin/main
  fi

  git pull --ff-only origin main
else
  echo "Warning: git remote 'origin' not found. Skipping main sync."
fi

# ----------------------------------------
# Create or reset branch from main
# ----------------------------------------

if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  git checkout "$BRANCH_NAME"
else
  git checkout -b "$BRANCH_NAME"
fi

# ----------------------------------------
# GitHub PR setup
# ----------------------------------------

PR_URL=""

if command -v gh >/dev/null 2>&1; then
  if git remote get-url origin >/dev/null 2>&1; then
    EXISTING_PR="$(gh pr list --head "$BRANCH_NAME" --json url --jq '.[0].url' 2>/dev/null || true)"

    if [[ -n "$EXISTING_PR" && "$EXISTING_PR" != "null" ]]; then
      PR_URL="$EXISTING_PR"
    else
      if git ls-remote --exit-code --heads origin "$BRANCH_NAME" >/dev/null 2>&1; then
        :
      else
        git push -u origin "$BRANCH_NAME"
      fi

      PR_TITLE="Issue #$ISSUE_NUMBER: $SLUG_CLEAN"
      PR_BODY=$(cat <<EOF
## Summary

Start work on issue #$ISSUE_NUMBER.

## Changes

- Create session branch \`$BRANCH_NAME\`
- Initialize implementation session context
- Link draft PR to issue tracking
- Closes #$ISSUE_NUMBER

EOF
)

      PR_URL="$(gh pr create \
        --base main \
        --head "$BRANCH_NAME" \
        --title "$PR_TITLE" \
        --body "$PR_BODY" \
        --draft)"
    fi
  else
    echo "Warning: git remote 'origin' not found. Skipping PR creation."
  fi
else
  echo "Warning: GitHub CLI (gh) not found. Skipping PR creation."
fi

# ----------------------------------------
# Update .ai/current.md
# ----------------------------------------

CURRENT_FILE=".ai/current.md"

if [[ -f "$CURRENT_FILE" ]]; then
  TMP_FILE="$(mktemp)"

  awk -v session="$SESSION_NAME" \
      -v branch="$BRANCH_NAME" \
      -v pr="$PR_URL" '
BEGIN {
  in_session = 0
  saw_name = 0
  saw_branch = 0
  saw_pr = 0
}
/^## Session/ {
  print
  in_session = 1
  next
}
in_session == 1 && /^## / {
  if (!saw_name) print "- name: " session
  if (!saw_branch) print "- branch: " branch
  if (!saw_pr) print "- pr: " pr
  in_session = 0
}
in_session == 1 && /^- name:/ {
  print "- name: " session
  saw_name = 1
  next
}
in_session == 1 && /^- branch:/ {
  print "- branch: " branch
  saw_branch = 1
  next
}
in_session == 1 && /^- pr:/ {
  print "- pr: " pr
  saw_pr = 1
  next
}
{
  print
}
END {
  if (in_session == 1) {
    if (!saw_name) print "- name: " session
    if (!saw_branch) print "- branch: " branch
    if (!saw_pr) print "- pr: " pr
  }
}
' "$CURRENT_FILE" > "$TMP_FILE"

  mv "$TMP_FILE" "$CURRENT_FILE"
fi

# ----------------------------------------
# Print context bundle
# ----------------------------------------

echo "========================================"
echo "SESSION"
echo "========================================"
echo "Name:   $SESSION_NAME"
echo "Branch: $BRANCH_NAME"
echo "PR:     ${PR_URL:-"(not created)"}"
echo ""

echo "========================================"
echo "AGENT"
echo "========================================"
cat AGENT.md
echo ""

echo "========================================"
echo "PROJECT"
echo "========================================"
cat .ai/project.md
echo ""

echo "========================================"
echo "CURRENT"
echo "========================================"
cat .ai/current.md
echo ""

echo "========================================"
echo "ISSUE"
echo "========================================"
cat "$ISSUE_PATH"
echo ""

echo "========================================"
echo "READY"
echo "========================================"
echo "Session initialized. You may begin implementation."