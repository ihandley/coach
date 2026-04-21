#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
AI_DIR="${ROOT_DIR}/.ai"
OUTPUT_FILE="${AI_DIR}/session-handoff.md"

PROJECT_FILE="${AI_DIR}/project.md"
CURRENT_FILE="${AI_DIR}/current.md"
STAGE_FILE="${AI_DIR}/stage.md"
ISSUES_DIR="${AI_DIR}/issues"

mkdir -p "${AI_DIR}"
mkdir -p "${ISSUES_DIR}"

ACTIVE_ISSUE_PATH=""
ACTIVE_ISSUE_TEXT="(missing active issue file)"

if [[ -f "${CURRENT_FILE}" ]]; then
  ACTIVE_ISSUE_REF="$(grep -E '^## Active Issue$' -A1 "${CURRENT_FILE}" | tail -n1 | sed 's/^[[:space:]]*//')"

  if [[ -n "${ACTIVE_ISSUE_REF:-}" && "${ACTIVE_ISSUE_REF}" != "## Branch" && "${ACTIVE_ISSUE_REF}" != "## Current Task" ]]; then
    ACTIVE_ISSUE_PATH="${ROOT_DIR}/${ACTIVE_ISSUE_REF#./}"
    ACTIVE_ISSUE_PATH="${ACTIVE_ISSUE_PATH#${ROOT_DIR}/./}"
    if [[ -f "${ACTIVE_ISSUE_PATH}" ]]; then
      ACTIVE_ISSUE_TEXT="$(cat "${ACTIVE_ISSUE_PATH}")"
    fi
  fi
fi

PROJECT_TEXT="(missing .ai/project.md)"
CURRENT_TEXT="(missing .ai/current.md)"
STAGE_TEXT="(missing .ai/stage.md)"

[[ -f "${PROJECT_FILE}" ]] && PROJECT_TEXT="$(cat "${PROJECT_FILE}")"
[[ -f "${CURRENT_FILE}" ]] && CURRENT_TEXT="$(cat "${CURRENT_FILE}")"
[[ -f "${STAGE_FILE}" ]] && STAGE_TEXT="$(cat "${STAGE_FILE}")"

cat > "${OUTPUT_FILE}" <<EOF
========================================
AGENT
========================================
$(cat "${ROOT_DIR}/AGENT.md" 2>/dev/null || echo "(missing AGENT.md)")

========================================
PROJECT
========================================
${PROJECT_TEXT}

========================================
CURRENT
========================================
${CURRENT_TEXT}

========================================
STAGE
========================================
${STAGE_TEXT}

========================================
ISSUE
========================================
${ACTIVE_ISSUE_TEXT}

========================================
END CONTEXT
========================================
EOF

echo "Generated ${OUTPUT_FILE}"