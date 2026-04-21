#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
HANDOFF_FILE="${ROOT_DIR}/.ai/session-handoff.md"
GENERATE_SCRIPT="${ROOT_DIR}/scripts/generate-session-handoff.sh"

if [[ ! -x "${GENERATE_SCRIPT}" ]]; then
  echo "Missing or non-executable script: ${GENERATE_SCRIPT}"
  exit 1
fi

"${GENERATE_SCRIPT}"

if [[ ! -f "${HANDOFF_FILE}" ]]; then
  echo "Handoff file was not generated: ${HANDOFF_FILE}"
  exit 1
fi

pbcopy < "${HANDOFF_FILE}"

echo "Copied ${HANDOFF_FILE} to clipboard"