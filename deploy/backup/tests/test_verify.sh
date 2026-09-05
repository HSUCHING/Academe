#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
VERIFY_SCRIPT="$(cd "$SCRIPT_DIR/.." && pwd -P)/verify.sh"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

[[ -x "$VERIFY_SCRIPT" ]] || fail "verify.sh must exist and be executable"
grep -Fq 'sha256sum --check' "$VERIFY_SCRIPT" || fail "checksum verification is required"
grep -Fq 'pg_restore --list' "$VERIFY_SCRIPT" || fail "PostgreSQL catalog verification is required"
grep -Fq 'tar -tzf' "$VERIFY_SCRIPT" || fail "content archive verification is required"

TEST_ROOT="$(mktemp -d)"
trap 'rm -rf -- "$TEST_ROOT"' EXIT

if "$VERIFY_SCRIPT" "$TEST_ROOT/missing" >/dev/null 2>&1; then
  fail "a missing backup directory must be rejected"
fi

mkdir "$TEST_ROOT/incomplete"
touch "$TEST_ROOT/incomplete/postgres.dump"
touch "$TEST_ROOT/incomplete/content.tar.gz"
touch "$TEST_ROOT/incomplete/metadata.txt"

if "$VERIFY_SCRIPT" "$TEST_ROOT/incomplete" >/dev/null 2>&1; then
  fail "a backup without SHA256SUMS must be rejected"
fi

printf 'PASS: verifier rejects missing and incomplete backups\n'
