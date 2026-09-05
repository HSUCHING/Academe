#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
BACKUP_DIR="$(cd "$SCRIPT_DIR/.." && pwd -P)"
SERVICE="$BACKUP_DIR/systemd/academe-backup.service"
TIMER="$BACKUP_DIR/systemd/academe-backup.timer"
INSTALLER="$BACKUP_DIR/install-systemd.sh"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

[[ -f "$SERVICE" ]] || fail "service unit must exist"
[[ -f "$TIMER" ]] || fail "timer unit must exist"
[[ -x "$INSTALLER" ]] || fail "installer must exist and be executable"

grep -Fq 'Type=oneshot' "$SERVICE" || fail "service must be oneshot"
grep -Fq 'ExecStart=/home/dev/RxProjects/Academe/deploy/backup/backup.sh' "$SERVICE" ||
  fail "service must use the production repository path"
grep -Fq 'ConditionPathExists=/home/dev/RxProjects/Academe/deploy/backup/backup.sh' "$SERVICE" ||
  fail "service must use a systemd-compatible path condition"
! grep -Fq 'ConditionPathIsExecutable=' "$SERVICE" || fail "unsupported systemd condition is forbidden"
if grep -Eqi 'password|secret|token|Environment=' "$SERVICE" "$TIMER"; then
  fail "systemd units must not contain credentials or environment values"
fi

grep -Fq 'OnCalendar=*-*-* 03:15:00' "$TIMER" || fail "timer schedule must be 03:15"
grep -Fq 'RandomizedDelaySec=15m' "$TIMER" || fail "timer random delay must be 15 minutes"
grep -Fq 'Persistent=true' "$TIMER" || fail "timer must catch up after downtime"
grep -Fq 'WantedBy=timers.target' "$TIMER" || fail "timer must install under timers.target"

grep -Fq 'systemctl daemon-reload' "$INSTALLER" || fail "installer must reload systemd"
grep -Fq 'systemctl enable --now academe-backup.timer' "$INSTALLER" ||
  fail "installer must enable and start the timer"
printf 'PASS: systemd scheduling contract is correct\n'
