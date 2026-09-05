#!/usr/bin/env bash
set -euo pipefail

fail() {
  printf 'Backup failed: %s\n' "$1" >&2
  exit 1
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd -P)"
COMPOSE_FILE="$REPO_ROOT/deploy/docker-compose.yml"
CONTENT_DIR="$(realpath -m -- "${ACADEME_CONTENT_DIR:-$REPO_ROOT/runtime-data/content}")"
BACKUP_ROOT="$(realpath -m -- "${ACADEME_BACKUP_ROOT:-$REPO_ROOT/runtime-data/backups}")"
RETENTION_DAYS="${ACADEME_BACKUP_RETENTION_DAYS:-14}"
VERIFY_SCRIPT="$SCRIPT_DIR/verify.sh"

[[ "$CONTENT_DIR" == "$REPO_ROOT/runtime-data/content" ]] ||
  fail "content directory must resolve to the Academe runtime content path"
[[ "$BACKUP_ROOT" == "$REPO_ROOT/runtime-data/backups" ]] ||
  fail "backup root must resolve to the Academe runtime backup path"
[[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] ||
  fail "retention days must be a non-negative integer"
[[ -f "$COMPOSE_FILE" ]] || fail "Compose file is missing"
[[ -d "$CONTENT_DIR" ]] || fail "content directory is missing"
[[ -x "$VERIFY_SCRIPT" ]] || fail "verification script is missing"

mkdir -p -- "$BACKUP_ROOT"
exec 9>"$BACKUP_ROOT/.backup.lock"
flock -n 9 || fail "another backup is already running"

postgres_health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' academe-postgres)"
[[ "$postgres_health" == "healthy" ]] || fail "PostgreSQL is not healthy"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
FINAL_DIR="$BACKUP_ROOT/academe-backup-$timestamp"
INCOMPLETE_DIR="$BACKUP_ROOT/.incomplete-$timestamp-$$"
[[ ! -e "$FINAL_DIR" ]] || fail "backup directory already exists"
mkdir -m 0700 -- "$INCOMPLETE_DIR"

cleanup_incomplete() {
  if [[ -d "$INCOMPLETE_DIR" ]]; then
    rm -rf -- "$INCOMPLETE_DIR"
  fi
}
trap cleanup_incomplete EXIT

docker compose -f "$COMPOSE_FILE" exec -T postgres sh -eu -c \
  'exec pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  >"$INCOMPLETE_DIR/postgres.dump"

docker run --rm \
  --mount "type=bind,src=$CONTENT_DIR,dst=/source,readonly" \
  --mount "type=bind,src=$INCOMPLETE_DIR,dst=/backup" \
  redis:7.2.3-alpine sh -eu -c \
  'tar -czf /backup/content.tar.gz -C /source .
   chmod 0644 /backup/content.tar.gz'

git_commit="$(git -C "$REPO_ROOT" rev-parse HEAD)"
git_branch="$(git -C "$REPO_ROOT" branch --show-current)"
app_image="$(docker inspect --format '{{.Config.Image}}' academe-app)"
postgres_state="$(docker inspect --format '{{.State.Status}}/{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' academe-postgres)"
redis_state="$(docker inspect --format '{{.State.Status}}/{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' academe-redis)"
app_state="$(docker inspect --format '{{.State.Status}}/{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' academe-app)"

{
  printf 'created_utc=%s\n' "$timestamp"
  printf 'git_commit=%s\n' "$git_commit"
  printf 'git_branch=%s\n' "$git_branch"
  printf 'app_image=%s\n' "$app_image"
  printf 'postgres_state=%s\n' "$postgres_state"
  printf 'redis_state=%s\n' "$redis_state"
  printf 'app_state=%s\n' "$app_state"
} >"$INCOMPLETE_DIR/metadata.txt"

(
  cd "$INCOMPLETE_DIR"
  sha256sum postgres.dump content.tar.gz metadata.txt >SHA256SUMS
)

"$VERIFY_SCRIPT" "$INCOMPLETE_DIR"
mv -- "$INCOMPLETE_DIR" "$FINAL_DIR"
trap - EXIT

find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -name 'academe-backup-*' -mtime +"$RETENTION_DAYS" -exec rm -rf -- {} +

printf 'Backup completed: %s\n' "$FINAL_DIR"
