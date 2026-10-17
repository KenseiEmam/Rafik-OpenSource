#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
infra_dir="$(cd -- "$script_dir/.." && pwd)"
env_file="${1:-$infra_dir/.env.selfhost}"

if [[ ! -f "$env_file" ]]; then
  echo "Environment file not found: $env_file" >&2
  echo "Copy infrastructure/.env.selfhost.example to infrastructure/.env.selfhost and configure it first." >&2
  exit 1
fi

if [[ "$EUID" -ne 0 ]] && command -v sudo >/dev/null 2>&1; then
  sudo docker compose --env-file "$env_file" -f "$infra_dir/compose.yaml" --profile selfhost up -d --build
else
  docker compose --env-file "$env_file" -f "$infra_dir/compose.yaml" --profile selfhost up -d --build
fi
