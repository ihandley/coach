#!/usr/bin/env bash
set -euo pipefail

# Sync GitHub issues into local .ai/issues/*.md files.
#
# Usage examples:
#   ./scripts/sync-github-issues-to-ai.sh --repo ihandley/opencode-config --label job-coach-rebuild
#   ./scripts/sync-github-issues-to-ai.sh --repo ihandley/opencode-config --issue 123
#   ./scripts/sync-github-issues-to-ai.sh --repo ihandley/opencode-config --issue 123 --issue 124
#   ./scripts/sync-github-issues-to-ai.sh --repo ihandley/opencode-config --state all --limit 50
#
# Requirements:
#   - gh installed and authenticated
#   - jq installed

REPO=""
STATE="open"
LIMIT="100"
DEST_DIR=".ai/issues"
MODE="search"
LABELS=()
ISSUES=()

usage() {
  cat <<USAGE
Usage: $0 --repo OWNER/REPO [options]

Options:
  --repo OWNER/REPO       GitHub repo, required
  --label LABEL           Filter by label, repeatable
  --issue NUMBER          Sync specific issue number, repeatable
  --state STATE           open | closed | all (default: open)
  --limit N               Max issues to fetch in search mode (default: 100)
  --dest DIR              Output directory (default: .ai/issues)
  -h, --help              Show this help

Notes:
  - If one or more --issue values are provided, those issue numbers are synced directly.
  - Otherwise, issues are fetched with gh issue list using the provided filters.
  - Pull requests are ignored.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO="${2:-}"
      shift 2
      ;;
    --label)
      LABELS+=("${2:-}")
      shift 2
      ;;
    --issue)
      ISSUES+=("${2:-}")
      shift 2
      ;;
    --state)
      STATE="${2:-}"
      shift 2
      ;;
    --limit)
      LIMIT="${2:-}"
      shift 2
      ;;
    --dest)
      DEST_DIR="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$REPO" ]]; then
  echo "Error: --repo is required" >&2
  usage
  exit 1
fi

command -v gh >/dev/null 2>&1 || {
  echo "Error: GitHub CLI (gh) is required." >&2
  exit 1
}

command -v jq >/dev/null 2>&1 || {
  echo "Error: jq is required." >&2
  exit 1
}

mkdir -p "$DEST_DIR"

slugify() {
  local s="$1"
  s="$(printf '%s' "$s" | tr '[:upper:]' '[:lower:]')"
  s="$(printf '%s' "$s" | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g')"
  printf '%s' "$s"
}

write_issue_file() {
  local issue_json="$1"

  local number title body state url created_at updated_at labels filename slug label_csv
  number="$(jq -r '.number' <<<"$issue_json")"
  title="$(jq -r '.title' <<<"$issue_json")"
  body="$(jq -r '.body // ""' <<<"$issue_json")"
  state="$(jq -r '.state' <<<"$issue_json")"
  url="$(jq -r '.url' <<<"$issue_json")"
  created_at="$(jq -r '.createdAt' <<<"$issue_json")"
  updated_at="$(jq -r '.updatedAt' <<<"$issue_json")"
  label_csv="$(jq -r '[.labels[].name] | join(", ")' <<<"$issue_json")"

  slug="$(slugify "$title")"
  filename="$(printf '%04d-%s.md' "$number" "$slug")"

  cat > "$DEST_DIR/$filename" <<EOF2
# GitHub Issue #$number

- Title: $title
- State: $state
- Labels: ${label_csv:-none}
- URL: $url
- Created: $created_at
- Updated: $updated_at

## Body

$body
EOF2

  echo "$filename"
}

written_files=()

if [[ ${#ISSUES[@]} -gt 0 ]]; then
  for issue_number in "${ISSUES[@]}"; do
    issue_json="$(gh issue view "$issue_number" --repo "$REPO" --json number,title,body,state,url,createdAt,updatedAt,labels)"
    written_files+=("$(write_issue_file "$issue_json")")
  done
else
  label_args=()
  for label in "${LABELS[@]}"; do
    label_args+=(--label "$label")
  done

  issues_json="$({
    gh issue list \
      --repo "$REPO" \
      --state "$STATE" \
      --limit "$LIMIT" \
      --json number,title,body,state,url,createdAt,updatedAt,labels \
      "${label_args[@]}"
  })"

  mapfile -t issue_rows < <(jq -c '.[]' <<<"$issues_json")

  for issue_json in "${issue_rows[@]}"; do
    written_files+=("$(write_issue_file "$issue_json")")
  done
fi

INDEX_FILE="$DEST_DIR/INDEX.md"
{
  echo "# Synced GitHub Issues"
  echo
  echo "- Repo: $REPO"
  echo "- Generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  echo
  for f in "${written_files[@]}"; do
    if [[ -f "$DEST_DIR/$f" ]]; then
      title_line="$(grep -m1 '^- Title:' "$DEST_DIR/$f" | sed 's/^- Title: //')"
      echo "- [$f](./$f) - $title_line"
    fi
  done
} > "$INDEX_FILE"

echo "Synced ${#written_files[@]} issue(s) into $DEST_DIR"
echo "Index: $INDEX_FILE"
