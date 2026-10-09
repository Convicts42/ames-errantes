#!/usr/bin/env bash
set -euo pipefail
[[ $EUID == 0 ]] || { echo 'Lancer ce script avec sudo.' >&2; exit 1; }
source_dir=$(cd -- "$(dirname -- "$0")" && pwd)
account=ames-documents
if ! id "$account" >/dev/null 2>&1; then useradd --create-home --shell /bin/bash "$account"; fi
for group in docker sudo adm; do
  if id -nG "$account" | tr ' ' '\n' | grep -qx "$group"; then
    echo 'Le compte documentaire possède déjà des privilèges à examiner.' >&2; exit 2
  fi
done
install -d -m 755 /usr/local/libexec
install -o root -g root -m 755 "$source_dir/documents-mcp.sh" /usr/local/libexec/ames-documents-mcp
rule=$(mktemp)
trap 'rm -f -- "$rule"' EXIT
printf '%s\n' 'ames-documents ALL=(root) NOPASSWD: /usr/local/libexec/ames-documents-mcp ""' > "$rule"
visudo -cf "$rule"
install -o root -g root -m 440 "$rule" /etc/sudoers.d/ames-documents
install -d -o "$account" -g "$account" -m 700 "/home/$account/.ssh"
echo 'Compte prêt. Ajouter la clé publique du Mac avec add-documents-key.sh.'
