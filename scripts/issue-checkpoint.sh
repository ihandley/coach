#!/usr/bin/env bash
set -euo pipefail

ISSUE_NUMBER="${1:-}"
LIST_OPEN_ISSUES="false"

if [[ "${1:-}" == "--list-open" ]]; then
  LIST_OPEN_ISSUES="true"
  ISSUE_NUMBER="${2:-}"
elif [[ "${2:-}" == "--list-open" ]]; then
  LIST_OPEN_ISSUES="true"
fi

MAX_BRANCH_LEN=60

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: not inside a git repository"
  exit 1
fi

REPO_URL=$(git remote get-url origin 2>/dev/null | sed -E 's/git@github.com:/https:\/\/github.com\//' | sed -E 's/\.git$//')
REPO_FULL_NAME=$(basename "$(dirname "$REPO_URL")")/$(basename "$REPO_URL")

slugify() {
  echo "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g' \
    | sed -E 's/^-+|-+$//g'
}

make_branch_name() {
  local issue_number="$1"
  local title="$2"
  local prefix="${issue_number}-"
  local max_slug_len=$((MAX_BRANCH_LEN - ${#prefix}))
  local slug

  slug=$(slugify "$title")
  slug="${slug:0:$max_slug_len}"
  slug=$(echo "$slug" | sed -E 's/-+$//')

  echo "${prefix}${slug}"
}

ISSUE_TITLE=""
ISSUE_BODY=""
BRANCH_NAME=""
PR_URL=""
PR_STATUS_NOTE=""
PR_STATE=""
PR_IS_DRAFT=""

if [[ -n "$ISSUE_NUMBER" ]]; then
  echo "Syncing main..."
  git checkout main >/dev/null 2>&1 || true
  git fetch origin
  git pull --ff-only origin main

  if command -v gh >/dev/null 2>&1; then
    ISSUE_TITLE=$(gh issue view "$ISSUE_NUMBER" --json title --jq '.title' 2>/dev/null || true)
    ISSUE_BODY=$(gh issue view "$ISSUE_NUMBER" --json body --jq '.body' 2>/dev/null || true)
  fi

  if [[ -z "$ISSUE_TITLE" ]]; then
    ISSUE_TITLE="issue-$ISSUE_NUMBER"
  fi

  BRANCH_NAME=$(make_branch_name "$ISSUE_NUMBER" "$ISSUE_TITLE")

  echo "Preparing branch: $BRANCH_NAME"

  if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    git checkout "$BRANCH_NAME"
  else
    git checkout -b "$BRANCH_NAME"
  fi

  git push -u origin "$BRANCH_NAME" >/dev/null 2>&1 || true

  if command -v gh >/dev/null 2>&1; then
    echo "Checking for existing PR..."

    EXISTING_PR=$(gh pr list --head "$BRANCH_NAME" --json url --jq '.[0].url' || true)

    if [[ -n "$EXISTING_PR" && "$EXISTING_PR" != "null" ]]; then
      PR_URL="$EXISTING_PR"
      PR_STATE=$(gh pr view "$PR_URL" --json state --jq '.state' 2>/dev/null || true)
      PR_IS_DRAFT=$(gh pr view "$PR_URL" --json isDraft --jq '.isDraft' 2>/dev/null || true)
    else
      echo "Attempting to create draft PR..."

      set +e
      PR_CREATE_OUTPUT=$(gh pr create \
        --base main \
        --head "$BRANCH_NAME" \
        --title "Issue #$ISSUE_NUMBER: $ISSUE_TITLE" \
        --body "## Summary

Start work on issue #$ISSUE_NUMBER.

## Scope

See issue #$ISSUE_NUMBER for full requirements.

Closes #$ISSUE_NUMBER" \
        --draft 2>&1)
      PR_CREATE_EXIT_CODE=$?
      set -e

      if [[ $PR_CREATE_EXIT_CODE -eq 0 ]]; then
        PR_URL="$PR_CREATE_OUTPUT"
        PR_STATE=$(gh pr view "$PR_URL" --json state --jq '.state' 2>/dev/null || true)
        PR_IS_DRAFT=$(gh pr view "$PR_URL" --json isDraft --jq '.isDraft' 2>/dev/null || true)
      elif echo "$PR_CREATE_OUTPUT" | grep -q "No commits between"; then
        PR_STATUS_NOTE="Draft PR not created yet. Create the first checkpoint commit, push, then re-run this script."
      else
        echo "Warning: failed to create PR"
        echo "$PR_CREATE_OUTPUT"
      fi
    fi
  fi
fi

echo ""
echo "===== ISSUE CHECKPOINT ====="
echo ""
echo "Paste everything below into the next ChatGPT session or use it to orient the current issue/PR review."
echo ""

echo "----- REPO -----"
echo "Repo:   ${REPO_URL:-"(unknown)"}"
echo "Path:   $(pwd)"
echo "Branch: $(git branch --show-current)"
echo ""
echo "Git status:"
git status --short || true

echo ""
echo "----- RECENT COMMITS -----"
git log --oneline -5 || true

echo ""
echo "----- CHANGED FILES VS MAIN -----"
git diff --stat main...HEAD || true

if [[ -n "$ISSUE_NUMBER" ]]; then
  echo ""
  echo "----- CURRENT ISSUE -----"
  echo "Issue:  #$ISSUE_NUMBER"
  echo "Title:  $ISSUE_TITLE"
  echo "Branch: $BRANCH_NAME"
  echo "PR:     ${PR_URL:-"(not created yet)"}"

  if [[ -n "$PR_STATE" || -n "$PR_IS_DRAFT" ]]; then
    echo "PR status: state=${PR_STATE:-unknown}, draft=${PR_IS_DRAFT:-unknown}"
  fi

  if [[ -n "$PR_STATUS_NOTE" ]]; then
    echo "Note:   $PR_STATUS_NOTE"
  fi

  if [[ -n "$ISSUE_BODY" ]]; then
    echo ""
    echo "Issue body:"
    echo "$ISSUE_BODY"
  fi
fi

if [[ "$LIST_OPEN_ISSUES" == "true" ]]; then
  echo ""
  echo "----- OPEN ISSUES -----"
  if command -v gh >/dev/null 2>&1; then
    gh issue list --state open --limit 10 || true
  else
    echo "gh not found"
  fi
fi

echo ""
echo "----- REPO GUIDANCE -----"
GUIDANCE_FOUND="false"

if [[ -f .github/copilot-instructions.md ]]; then
  echo "# .github/copilot-instructions.md"
  cat .github/copilot-instructions.md
  GUIDANCE_FOUND="true"
fi

if compgen -G ".github/instructions/*.instructions.md" >/dev/null; then
  for guidance_file in .github/instructions/*.instructions.md; do
    echo ""
    echo "# $guidance_file"
    cat "$guidance_file"
    GUIDANCE_FOUND="true"
  done
fi

if [[ -f AGENTS.md ]]; then
  echo ""
  echo "# AGENTS.md"
  cat AGENTS.md
  GUIDANCE_FOUND="true"
fi

if [[ -f CODEX.md ]]; then
  echo ""
  echo "# CODEX.md"
  cat CODEX.md
  GUIDANCE_FOUND="true"
fi

if [[ "$GUIDANCE_FOUND" == "false" ]]; then
  echo "No repo guidance files found."
fi

echo ""
echo "----- SUGGESTED NEXT STEPS -----"
if [[ -n "$(git status --short)" ]]; then
  echo "Working tree has uncommitted changes. Review, stage, commit, and push them before final PR review."
elif [[ -z "$PR_URL" ]]; then
  echo "No PR exists yet. Create a checkpoint commit, push it, then re-run this script."
elif [[ "$PR_IS_DRAFT" == "true" ]]; then
  echo "Draft PR exists. Continue Codex/review workflow, then mark ready when complete."
else
  echo "Working tree is clean and PR exists. Ready for review/merge workflow."
fi

echo ""
echo "===== END CHECKPOINT ====="
