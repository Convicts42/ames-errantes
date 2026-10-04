#!/usr/bin/env bash
set -euo pipefail
root=/opt/ames-errantes
release=${1:?Version manquante}
[[ "$release" =~ ^[0-9]{8}-[0-9]{2,6}$ ]] || exit 2
candidate="$root/releases/$release"
compose=(docker compose --project-directory "$candidate" --env-file "$root/shared/.env" --env-file "$candidate/release.env" -f "$candidate/deploy/raspberry/compose.yaml")
[[ ! -e "$root/shared/import/RESTORED" ]] || { echo 'Import deja termine : aucun remplacement.' >&2; exit 3; }
"${compose[@]}" up -d --wait db
count=$("${compose[@]}" exec -T db psql -U ames -d ames -Atc "SELECT count(*) FROM pg_tables WHERE schemaname='public'")
[[ "$count" == 0 ]] || { echo 'Refus : la base cible contient deja des tables.' >&2; exit 4; }
cd "$root/shared/import"
sha256sum --check database.dump.sha256
"${compose[@]}" cp database.dump db:/tmp/ames-import.dump
"${compose[@]}" exec -T db pg_restore --list /tmp/ames-import.dump > /dev/null
"${compose[@]}" exec -T db pg_restore -U ames -d ames --no-owner --no-acl --single-transaction --exit-on-error /tmp/ames-import.dump
"${compose[@]}" exec -T db rm /tmp/ames-import.dump
printf '%s\n' "$(date -Is)" > "$root/shared/import/RESTORED"
echo 'Import transactionnel termine.'
