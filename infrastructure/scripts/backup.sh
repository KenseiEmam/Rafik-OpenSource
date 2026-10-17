#!/usr/bin/env bash
set -euo pipefail
umask 077

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
infra_dir="$(cd -- "$script_dir/.." && pwd)"
env_file="${1:-$infra_dir/.env.selfhost}"
backup_root="${2:-$infra_dir/backups}"
compose=(docker compose --env-file "$env_file" -f "$infra_dir/compose.yaml" --profile selfhost)

if ! "${compose[@]}" ps --status running --services | grep -qx api; then
  echo "The self-hosted API must be running before backup." >&2
  exit 1
fi

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$backup_root/$stamp"
mkdir -p -- "$backup_root"
mkdir -- "$target"
api_stopped=0
restart_api() {
  if [[ "$api_stopped" == 1 ]]; then "${compose[@]}" start api >/dev/null; fi
}
trap restart_api EXIT

# Pause writes so the PostgreSQL snapshot and private files describe one state.
"${compose[@]}" stop api >/dev/null
api_stopped=1
"${compose[@]}" exec -T db pg_dump -U rafik_migrate -Fc rafik > "$target/database.dump"
"${compose[@]}" run --rm --no-deps file-ops 'tar -czf - -C /data .' > "$target/private-files.tar.gz"
(
  cd -- "$target"
  sha256sum database.dump private-files.tar.gz > SHA256SUMS
)
restart_api
api_stopped=0
trap - EXIT
printf 'Backup created: %s\n' "$target"
