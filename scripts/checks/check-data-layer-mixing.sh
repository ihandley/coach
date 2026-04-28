#!/usr/bin/env bash
set -euo pipefail

bad_files=$(
  grep -RIl "selectFrom" apps packages 2>/dev/null \
    | xargs grep -L "Kysely\|kysely" 2>/dev/null || true
)

if [ -n "$bad_files" ]; then
  echo "Possible Kysely usage without explicit Kysely context:"
  echo "$bad_files"
  exit 1
fi

echo "Data-layer mixing check passed."
