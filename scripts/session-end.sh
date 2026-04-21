#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CURRENT_FILE="${ROOT_DIR}/.ai/current.md"
HANDOFF_SCRIPT="${ROOT_DIR}/scripts/generate-session-handoff.sh"
HANDOFF_FILE="${ROOT_DIR}/.ai/session-handoff.md"

echo
echo "========================================"
echo "SESSION END"
echo "========================================"

echo
echo "Reminder: update .ai/current.md before finishing this session"
echo

if [[ -f "$CURRENT_FILE" ]]; then
  echo "Current file: $CURRENT_FILE"
  echo
  echo "Open it now:"
  echo "  code $CURRENT_FILE"
else
  echo "Warning: .ai/current.md not found"
fi

echo
read -p "Press enter after updating current.md..."

if [[ -x "$HANDOFF_SCRIPT" ]]; then
  "$HANDOFF_SCRIPT"
fi

if [[ -f "$HANDOFF_FILE" ]]; then
  pbcopy < "$HANDOFF_FILE"
  echo "Copied session handoff to clipboard"
else
  echo "Handoff file not found"
fi

echo
echo "Done"