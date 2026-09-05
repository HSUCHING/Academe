#!/usr/bin/env bash
set -euo pipefail

fail() {
  printf 'Backup verification failed: %s\n' "$1" >&2
  exit 1
}

[[ "$#" -eq 1 ]] || fail "usage: $0 BACKUP_DIRECTORY"
[[ -d "$1" ]] || fail "backup directory does not exist"

BACKUP_DIR="$(realpath -e -- "$1")"
REQUIRED_FILES=(
  postgres.dump
  content.tar.gz
  metadata.txt
  SHA256SUMS
)

for required_file in "${REQUIRED_FILES[@]}"; do
  [[ -f "$BACKUP_DIR/$required_file" ]] || fail "missing $required_file"
done

(
  cd "$BACKUP_DIR"
  sha256sum --check --strict SHA256SUMS
) || fail "checksum mismatch"

docker run --rm \
  --mount "type=bind,src=$BACKUP_DIR,dst=/backup,readonly" \
  pgvector/pgvector:pg16 \
  pg_restore --list /backup/postgres.dump >/dev/null ||
  fail "PostgreSQL dump catalog is unreadable"

tar -tzf "$BACKUP_DIR/content.tar.gz" >/dev/null ||
  fail "content archive is unreadable"

printf 'Backup verified: %s\n' "$BACKUP_DIR"
