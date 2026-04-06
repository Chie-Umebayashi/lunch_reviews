#!/usr/bin/env bash
# Dev Container 初回: reviews テーブルが無ければマイグレーションを適用する
set -euo pipefail

DB_URL="${DATABASE_URL%%\?*}"

for _ in $(seq 1 40); do
  if pg_isready -h db -p 5432 -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if psql "$DB_URL" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews'" | grep -q 1; then
  echo "db: reviews table already exists"
  exit 0
fi

echo "db: applying 001_initial_schema.sql"
psql "$DB_URL" -f "$(dirname "$0")/migrations/001_initial_schema.sql"
