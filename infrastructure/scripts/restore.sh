#!/usr/bin/env bash
set -euo pipefail
umask 077

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
infra_dir="$(cd -- "$script_dir/.." && pwd)"
env_file="${1:-$infra_dir/.env.selfhost}"
backup_dir="${2:?Usage: restore.sh [env-file] <backup-directory>; this replaces the target database and private files}"
compose=(docker compose --env-file "$env_file" -f "$infra_dir/compose.yaml" --profile selfhost)

if [[ ! -f "$backup_dir/database.dump" || ! -f "$backup_dir/private-files.tar.gz" || ! -f "$backup_dir/SHA256SUMS" ]]; then
  echo "Backup must contain database.dump, private-files.tar.gz, and SHA256SUMS." >&2
  exit 1
fi
(cd -- "$backup_dir" && sha256sum --check SHA256SUMS)

if ! "${compose[@]}" ps --status running --services | grep -qx api; then
  echo "The self-hosted API must be running before restore." >&2
  exit 1
fi

# Restore only to this explicitly selected instance; stopping the API prevents writes.
"${compose[@]}" stop api >/dev/null
api_stopped=1
restart_api() {
  if [[ "$api_stopped" == 1 ]]; then "${compose[@]}" start api >/dev/null; fi
}
trap restart_api EXIT
"${compose[@]}" exec -T db pg_restore -U rafik_migrate -d rafik --clean --if-exists --no-owner < "$backup_dir/database.dump"
"${compose[@]}" run --rm --no-deps -T file-ops 'find /data -mindepth 1 -delete && tar -xzf - -C /data' < "$backup_dir/private-files.tar.gz"
restart_api
api_stopped=0
trap - EXIT
"${compose[@]}" up -d --wait api web caddy
printf 'Database and private files restored from %s\n' "$backup_dir"
