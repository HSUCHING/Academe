#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
BACKUP_SCRIPT="$(cd "$SCRIPT_DIR/.." && pwd -P)/backup.sh"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

[[ -x "$BACKUP_SCRIPT" ]] || fail "backup.sh must exist and be executable"
grep -Fq 'set -euo pipefail' "$BACKUP_SCRIPT" || fail "strict mode is required"
grep -Fq 'flock -n' "$BACKUP_SCRIPT" || fail "non-blocking flock is required"
grep -Fq '.incomplete-' "$BACKUP_SCRIPT" || fail "an incomplete staging directory is required"
grep -Fq 'pg_dump -Fc' "$BACKUP_SCRIPT" || fail "custom-format pg_dump is required"
grep -Fq 'dst=/source,readonly' "$BACKUP_SCRIPT" || fail "content must be mounted read-only"
grep -Fq 'chmod 0644 /backup/content.tar.gz' "$BACKUP_SCRIPT" ||
  fail "the container-created archive must be host-readable"

verify_line="$(grep -n 'VERIFY_SCRIPT.*INCOMPLETE_DIR' "$BACKUP_SCRIPT" | head -1 | cut -d: -f1)"
publish_line="$(grep -n 'mv --.*INCOMPLETE_DIR.*FINAL_DIR' "$BACKUP_SCRIPT" | head -1 | cut -d: -f1)"
cleanup_line="$(grep -n 'find.*BACKUP_ROOT.*mtime' "$BACKUP_SCRIPT" | head -1 | cut -d: -f1)"

[[ -n "$verify_line" ]] || fail "backup must invoke the verifier"
[[ -n "$publish_line" ]] || fail "backup must atomically publish the staging directory"
[[ -n "$cleanup_line" ]] || fail "backup must implement retention"
(( verify_line < publish_line )) || fail "verification must happen before publication"
(( publish_line < cleanup_line )) || fail "retention must happen only after publication"

grep -Fq 'ACADEME_BACKUP_RETENTION_DAYS:-14' "$BACKUP_SCRIPT" ||
  fail "retention must default to 14 days"
printf 'PASS: backup workflow contract is safe and ordered\n'
