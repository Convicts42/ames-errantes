#!/usr/bin/env bash
# Installe le pont entre l'intranet et Claude Code (compte du responsable technique).
# Prérequis : Claude Code installé et connecté dans ce compte (`claude`, puis /login).
set -euo pipefail
[[ $EUID == 0 ]] || { echo 'Lancer ce script avec sudo.' >&2; exit 1; }
account=${1:-${SUDO_USER:-convicts}}
source_dir=$(cd -- "$(dirname -- "$0")" && pwd)
# Le conteneur « espace » tourne sous l'uid 1000 et doit pouvoir ouvrir le socket.
[[ $(id -u "$account") == 1000 ]] || { echo "Le compte $account doit avoir l'uid 1000, comme le conteneur." >&2; exit 2; }
node_bin=$(sudo -u "$account" -i bash -lc 'command -v node') || { echo "Node introuvable pour $account." >&2; exit 3; }
claude_bin=$(sudo -u "$account" -i bash -lc 'command -v claude') || { echo "Claude Code introuvable : l'installer avec curl -fsSL https://claude.ai/install.sh | bash" >&2; exit 4; }
install -d -o "$account" -g "$account" -m 700 /opt/ames-errantes/shared/claude
install -o root -g root -m 644 "$source_dir/claude-bridge.mjs" /usr/local/libexec/ames-claude-bridge.mjs
cat > /etc/systemd/system/ames-claude-bridge.service <<UNIT
[Unit]
Description=Pont Claude Code pour l'intranet Âmes errantes
After=docker.service

[Service]
User=$account
Environment=CLAUDE_BIN=$claude_bin
Environment=PATH=$(dirname "$claude_bin"):$(dirname "$node_bin"):/usr/local/bin:/usr/bin:/bin
ExecStart=$node_bin /usr/local/libexec/ames-claude-bridge.mjs
Restart=on-failure
MemoryMax=700M

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable ames-claude-bridge.service
systemctl restart ames-claude-bridge.service
echo 'Pont Claude actif. Relancer ce script après une mise à jour de claude-bridge.mjs.'
