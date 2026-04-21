#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/session-start.sh <issue-number>
#
# Examples:
#   ./scripts/session-start.sh 1
#   ./scripts/session-start.sh 0001

ISSUE_INPUT="${1:-}"

if [[ -z "$ISSUE_INPUT" ]]; then
  echo "Usage: $0 <issue-number>"
  echo "Example: $0 1"
  echo "Example: $0 0001"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

AGENT_FILE="$ROOT_DIR/AGENT.md"
PROJECT_FILE="$ROOT_DIR/.ai/project.md"
CURRENT_FILE="$ROOT_DIR/.ai/current.md"
ISSUES_DIR="$ROOT_DIR/.ai/issues"

normalize_issue_number() {
  local raw="$1"
  raw="${raw#\#}"

  if [[ ! "$raw" =~ ^[0-9]+$ ]]; then
    echo "Invalid issue number: $1" >&2
    exit 1
  fi

  printf "%04d" "$raw"
}

resolve_issue_path() {
  local normalized="$1"
  local matches=()

  while IFS= read -r path; do
    matches+=("$path")
  done < <(find "$ISSUES_DIR" -maxdepth 1 -type f -name "${normalized}-*.md" | sort)

  if [[ "${#matches[@]}" -eq 0 ]]; then
    echo "Could not find issue file for issue ${normalized} in $ISSUES_DIR" >&2
    exit 1
  fi

  if [[ "${#matches[@]}" -gt 1 ]]; then
    echo "Multiple issue files matched issue ${normalized}:" >&2
    printf ' - %s\n' "${matches[@]}" >&2
    exit 1
  fi

  echo "${matches[0]}"
}

ISSUE_NUMBER="$(normalize_issue_number "$ISSUE_INPUT")"
ISSUE_PATH="$(resolve_issue_path "$ISSUE_NUMBER")"

echo "========================================"
echo "SESSION START"
echo "========================================"
echo
echo "Reminder: verify .ai/current.md is accurate before proceeding"
echo

echo "========================================"
echo "AGENT"
echo "========================================"
[[ -f "$AGENT_FILE" ]] && cat "$AGENT_FILE" || echo "(missing AGENT.md)"

echo
echo "========================================"
echo "PROJECT"
echo "========================================"
[[ -f "$PROJECT_FILE" ]] && cat "$PROJECT_FILE" || echo "(missing .ai/project.md)"

echo
echo "========================================"
echo "CURRENT"
echo "========================================"
[[ -f "$CURRENT_FILE" ]] && cat "$CURRENT_FILE" || echo "(missing .ai/current.md)"

echo
echo "========================================"
echo "ISSUE"
echo "========================================"
[[ -f "$ISSUE_PATH" ]] && cat "$ISSUE_PATH" || echo "(missing issue file)"

echo
echo "========================================"
echo "END CONTEXT"
echo "========================================"