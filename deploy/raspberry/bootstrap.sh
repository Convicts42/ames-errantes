#!/usr/bin/env bash
set -euo pipefail
[[ $(id -u) -eq 0 ]] || { echo 'Lancer avec sudo.' >&2; exit 1; }
operator=${SUDO_USER:-convicts}
[[ "$operator" == convicts ]] || { echo 'Compte convicts attendu.' >&2; exit 1; }
. /etc/os-release
[[ "$ID" == debian && "$VERSION_CODENAME" == trixie && $(dpkg --print-architecture) == arm64 ]] || { echo 'Ce script cible Debian 13 arm64.' >&2; exit 1; }
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod 0644 /etc/apt/keyrings/docker.asc
cat > /etc/apt/sources.list.d/docker.sources <<'APT'
Types: deb
URIs: https://download.docker.com/linux/debian
Suites: trixie
Components: stable
Architectures: arm64
Signed-By: /etc/apt/keyrings/docker.asc
APT
apt-get update
apt-get install -y --no-install-recommends docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
usermod -aG docker "$operator"
install -d -o "$operator" -g "$operator" -m 0750 /opt/ames-errantes /opt/ames-errantes/releases /opt/ames-errantes/shared
install -d -o "$operator" -g "$operator" -m 0700 /opt/ames-errantes/shared/backups /opt/ames-errantes/shared/import
# Les futures sauvegardes sont accessibles au processus applicatif UID 1000.
[[ $(id -u "$operator") -eq 1000 ]] || { echo 'UID inattendu : adapter les droits du volume avant de poursuivre.' >&2; exit 1; }
docker version --format '{{.Server.Version}}'
docker compose version
echo 'INSTALLATION_PRETE - reconnecter SSH pour activer le groupe Docker.'
