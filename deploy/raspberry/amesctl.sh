#!/usr/bin/env bash
set -euo pipefail
root=/opt/ames-errantes
current=$(readlink -f "$root/current")
[[ "$current" == "$root/releases/"* && -f "$current/release.env" ]] || { echo 'Aucune version active.' >&2; exit 1; }
compose=(docker compose --project-directory "$current" --env-file "$root/shared/.env" --env-file "$current/release.env" -f "$current/deploy/raspberry/compose.yaml")
case "${1:-status}" in
  status) "${compose[@]}" ps; df -h "$root"; free -h ;;
  start) "${compose[@]}" up -d --wait --wait-timeout 180 ;;
  stop) "${compose[@]}" stop ;;
  logs) "${compose[@]}" logs --tail 80 "${2:-espace}" ;;
  backup) "${compose[@]}" exec -T espace node /app/packages/core/src/backup-command.mjs ;;
  mcp) exec "${compose[@]}" exec -T espace node /app/services/mcp/server.mjs ;;
  *) echo 'Usage: amesctl status|start|stop|logs [service]|backup|mcp' >&2; exit 2 ;;
esac
