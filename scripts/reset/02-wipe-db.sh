#!/usr/bin/env bash
# Runs 02-wipe-db.sql against $DATABASE_URL with safety gate.

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL not set in env." >&2
  exit 1
fi

case "$DATABASE_URL" in
  *fahqtnwwikvocpvvfgqi*)
    echo "Wiping NEW project (fahqtnwwikvocpvvfgqi)…"
    ;;
  *)
    echo "Refusing to wipe — DATABASE_URL does not point at the new project." >&2
    echo "Got: $DATABASE_URL" >&2
    exit 1
    ;;
esac

cd "$(dirname "$0")"
PGOPTIONS="--client-min-messages=warning" psql "$DATABASE_URL" \
  -v ON_ERROR_STOP=1 \
  -f 02-wipe-db.sql
