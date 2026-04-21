#!/usr/bin/env bash
set -euo pipefail

# Usage:
# ./scripts/ai-context.sh <stage-file> <issue-file>

STAGE_FILE="${1:-}"
ISSUE_FILE="${2:-}"

if [[ -z "$STAGE_FILE" || -z "$ISSUE_FILE" ]]; then
  echo "Usage: $0 <stage-file> <issue-file>"
  echo "Example: $0 01-foundation.md 0001-stage-1-foundation.md"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PROJECT_FILE="$ROOT_DIR/.ai/project.md"
CURRENT_FILE="$ROOT_DIR/.ai/current.md"
STAGE_PATH="$ROOT_DIR/.ai/stages/$STAGE_FILE"
ISSUE_PATH="$ROOT_DIR/.ai/issues/$ISSUE_FILE"
AGENT_FILE="$ROOT_DIR/AGENT.md"

echo "========================================"
echo "AGENT"
echo "========================================"
[[ -f "$AGENT_FILE" ]] && cat "$AGENT_FILE" || echo "(missing AGENT.md)"

echo
echo "========================================"
echo "PROJECT"
echo "========================================"
[[ -f "$PROJECT_FILE" ]] && cat "$PROJECT_FILE" || echo "(missing project.md)"

echo
echo "========================================"
echo "CURRENT"
echo "========================================"
[[ -f "$CURRENT_FILE" ]] && cat "$CURRENT_FILE" || echo "(missing current.md)"

echo
echo "========================================"
echo "STAGE"
echo "========================================"
[[ -f "$STAGE_PATH" ]] && cat "$STAGE_PATH" || echo "(missing stage file)"

echo
echo "========================================"
echo "ISSUE"
echo "========================================"
[[ -f "$ISSUE_PATH" ]] && cat "$ISSUE_PATH" || echo "(missing issue file)"

echo
echo "========================================"
echo "END CONTEXT"
echo "========================================"