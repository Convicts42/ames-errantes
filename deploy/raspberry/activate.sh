#!/usr/bin/env bash
set -euo pipefail
root=/opt/ames-errantes
release=${1:?Identifiant de version requis}
[[ "$release" =~ ^[0-9]{8}-[0-9]{2,6}$ ]] || exit 2
candidate="$root/releases/$release"
[[ -f "$candidate/release.env" && -f "$candidate/deploy/raspberry/compose.yaml" ]] || exit 3
exec 9>"$root/shared/deploy.lock"
flock -n 9 || { echo 'Un deploiement est deja en cours.' >&2; exit 4; }
previous=$(readlink -f "$root/current" || true)
compose=(docker compose --project-directory "$candidate" --env-file "$root/shared/.env" --env-file "$candidate/release.env" -f "$candidate/deploy/raspberry/compose.yaml")
"${compose[@]}" config --quiet
if [[ -L "$root/current" ]]; then bash "$root/current/deploy/raspberry/amesctl.sh" backup; fi
if "${compose[@]}" up -d --wait --wait-timeout 180; then
  if [[ -n "$previous" && "$previous" != "$candidate" && -d "$previous" ]]; then ln -sfn "$previous" "$root/previous"; fi
  ln -sfn "$candidate" "$root/current"
  echo "VERSION_ACTIVE=$release"
else
  echo 'Echec de mise en service. Les donnees sont conservees.' >&2
  if [[ "$previous" == "$root/releases/"* && -d "$previous" ]]; then
    docker compose --project-directory "$previous" --env-file "$root/shared/.env" --env-file "$previous/release.env" -f "$previous/deploy/raspberry/compose.yaml" up -d --wait --wait-timeout 180
  fi
  exit 1
fi
