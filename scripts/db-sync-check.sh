#!/usr/bin/env bash
# Verify Prisma schema and active migrations stay synchronized.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PKG="$ROOT_DIR/packages/database"
SCHEMA="$DB_PKG/prisma/schema.prisma"
BASELINE="$DB_PKG/prisma/migrations/20260801000000_baseline_schema/migration.sql"

if [[ ! -f "$SCHEMA" ]]; then
  echo "FAIL: missing schema at $SCHEMA" >&2
  exit 1
fi

if [[ ! -f "$BASELINE" ]]; then
  echo "FAIL: missing baseline migration at $BASELINE" >&2
  exit 1
fi

cd "$DB_PKG"

echo "==> prisma validate"
pnpm exec prisma validate

echo "==> ensure only one active migration exists"
migration_count="$(find prisma/migrations -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
if [[ "$migration_count" != "1" ]]; then
  echo "FAIL: expected exactly 1 active migration directory, found $migration_count" >&2
  find prisma/migrations -mindepth 1 -maxdepth 1 -type d >&2
  exit 1
fi

echo "==> baseline must equal schema from empty database"
tmp_diff="$(mktemp)"
pnpm exec prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script >"$tmp_diff"

if ! diff -u "$BASELINE" "$tmp_diff" >/tmp/prisma-baseline.diff; then
  echo "FAIL: baseline migration is out of sync with schema.prisma" >&2
  echo "Diff:" >&2
  cat /tmp/prisma-baseline.diff >&2
  rm -f "$tmp_diff"
  exit 1
fi
rm -f "$tmp_diff"

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "==> live database must match schema.prisma (no drift)"
  set +e
  pnpm exec prisma migrate diff \
    --from-url "$DATABASE_URL" \
    --to-schema-datamodel prisma/schema.prisma \
    --exit-code
  diff_status=$?
  set -e
  if [[ "$diff_status" -eq 0 ]]; then
    echo "OK: database matches schema"
  elif [[ "$diff_status" -eq 2 ]]; then
    echo "FAIL: database drifts from schema.prisma" >&2
    pnpm exec prisma migrate diff \
      --from-url "$DATABASE_URL" \
      --to-schema-datamodel prisma/schema.prisma \
      --script >&2
    exit 1
  else
    echo "FAIL: prisma migrate diff failed with status $diff_status" >&2
    exit "$diff_status"
  fi

  echo "==> migrate status"
  pnpm exec prisma migrate status
else
  echo "SKIP: DATABASE_URL unset; live drift check not run"
fi

echo "PASS: Prisma schema/migration synchronization checks succeeded"
