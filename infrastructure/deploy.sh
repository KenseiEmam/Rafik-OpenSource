#!/usr/bin/env bash
set -euo pipefail

infra_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
env_file="${1:-$infra_dir/.env.selfhost}"

if [[ ! -f "$env_file" ]]; then
  echo "Environment file not found: $env_file" >&2
  echo "Copy infrastructure/.env.selfhost.example to infrastructure/.env.selfhost and configure it first." >&2
  exit 1
fi

docker compose --env-file "$env_file" -f "$infra_dir/compose.yaml" --profile selfhost up -d --build
