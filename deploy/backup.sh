#!/bin/sh
set -eu
umask 077
ROOT=/opt/medic-demo
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$ROOT/backups"
exec 9>"$ROOT/backups/.lock"
flock -n 9 || exit 0
cd "$ROOT/app"
compose() { docker compose --env-file "$ROOT/runtime.env" -f deploy/compose.yml "$@"; }
# Pause writes so SQLite, documents and their immutable versions agree.
trap 'compose start cms >/dev/null' EXIT
compose stop cms
tar -C "$ROOT" -czf "$ROOT/backups/$STAMP.tar.gz.partial" storage runtime.env
tar -tzf "$ROOT/backups/$STAMP.tar.gz.partial" >/dev/null
mv "$ROOT/backups/$STAMP.tar.gz.partial" "$ROOT/backups/$STAMP.tar.gz"
compose start cms
trap - EXIT
find "$ROOT/backups" -maxdepth 1 -name '*.tar.gz' -mtime +14 -delete
printf 'Backup completed: %s\n' "$STAMP"
