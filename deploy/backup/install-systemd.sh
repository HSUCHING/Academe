#!/usr/bin/env bash
set -euo pipefail

fail() {
  printf 'systemd installation failed: %s\n' "$1" >&2
  exit 1
}

[[ "${EUID}" -eq 0 ]] || fail "run this installer as root"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
UNIT_SOURCE="$SCRIPT_DIR/systemd"
UNIT_TARGET="/etc/systemd/system"

for unit in academe-backup.service academe-backup.timer; do
  [[ -f "$UNIT_SOURCE/$unit" ]] || fail "missing $unit"
  install -o root -g root -m 0644 "$UNIT_SOURCE/$unit" "$UNIT_TARGET/$unit"
done

systemctl daemon-reload
systemctl enable --now academe-backup.timer
systemctl is-enabled academe-backup.timer
systemctl is-active academe-backup.timer
systemctl list-timers academe-backup.timer --no-pager
