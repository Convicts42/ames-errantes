#!/usr/bin/env bash
# Autorise une clé publique à lancer uniquement le MCP documentaire, sans shell.
set -euo pipefail
[[ $EUID == 0 ]] || { echo 'Lancer ce script avec sudo.' >&2; exit 1; }
key=${1:?Usage: sudo bash add-documents-key.sh "ssh-ed25519 AAAA... commentaire"}
[[ "$key" =~ ^ssh-ed25519\ [A-Za-z0-9+/=]+(\ [^\"]*)?$ ]] || { echo 'Clé publique ed25519 attendue (une seule ligne).' >&2; exit 2; }
account=ames-documents
file=/home/$account/.ssh/authorized_keys
install -d -o "$account" -g "$account" -m 700 "/home/$account/.ssh"
grep -qsF "${key%% *} $(cut -d' ' -f2 <<<"$key")" "$file" && { echo 'Clé déjà autorisée.'; exit 0; }
printf 'restrict,command="/usr/bin/sudo -n /usr/local/libexec/ames-documents-mcp" %s\n' "$key" >> "$file"
chown "$account:$account" "$file"
chmod 600 "$file"
echo 'Clé ajoutée : elle ne peut que lancer le MCP documentaire.'
