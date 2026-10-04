#!/usr/bin/env bash
set -euo pipefail
[[ $(uname -m) == aarch64 ]] || { echo 'Installation prévue pour ARM64.' >&2; exit 1; }
tools_root="$HOME/.local/lib/nodejs"
mkdir -p "$tools_root" "$HOME/.local/bin"
work=$(mktemp -d)
trap 'rm -rf -- "$work"' EXIT
curl -fsSL https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt -o "$work/SHASUMS256.txt"
archive=$(awk '$2 ~ /^node-v24\.[0-9]+\.[0-9]+-linux-arm64.tar.xz$/ {print $2}' "$work/SHASUMS256.txt")
[[ "$archive" =~ ^node-v24\.[0-9]+\.[0-9]+-linux-arm64.tar.xz$ ]] || exit 2
curl -fsSL "https://nodejs.org/dist/latest-v24.x/$archive" -o "$work/$archive"
(cd "$work"; grep "  $archive$" SHASUMS256.txt | sha256sum --check -)
node_root="$tools_root/${archive%.tar.xz}"
if [[ ! -x "$node_root/bin/node" ]]; then tar -xJf "$work/$archive" -C "$tools_root"; fi
for tool in node npm npx corepack; do
  destination="$HOME/.local/bin/$tool"
  [[ ! -e "$destination" || -L "$destination" ]] || { echo "Commande existante à examiner : $destination" >&2; exit 3; }
  ln -sfn "$node_root/bin/$tool" "$destination"
done
export PATH="$HOME/.local/bin:$PATH"
corepack enable --install-directory "$HOME/.local/bin"
corepack prepare pnpm@11.25.0 --activate
node --version
pnpm --version
