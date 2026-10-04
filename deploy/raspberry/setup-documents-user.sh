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
install -d -o "$account" -g "$account" -m 700 "/home/$account/.ssh" "/home/$account/.codex"
install -d -o "$account" -g "$account" -m 755 "/home/$account/projets/ames-errantes"
install -o "$account" -g "$account" -m 644 "$source_dir/documents-AGENTS.md" "/home/$account/projets/ames-errantes/AGENTS.md"
install -o "$account" -g "$account" -m 644 "$source_dir/documents-README.md" "/home/$account/projets/ames-errantes/README.md"
sudo -H -u "$account" bash -ec 'cd "$HOME"; curl -fsSL https://chatgpt.com/codex/install.sh -o "$HOME/.codex/install.sh"; CODEX_NON_INTERACTIVE=1 sh "$HOME/.codex/install.sh"'
sudo -H -u "$account" bash -ec 'cd "$HOME"; exec "$HOME/.local/bin/codex" mcp add ames-errantes -- /usr/bin/sudo -n /usr/local/libexec/ames-documents-mcp'
echo 'Compte prêt. Ajouter la clé publique du Mac, puis connecter le compte ChatGPT personnel.'
