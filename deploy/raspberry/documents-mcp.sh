#!/usr/bin/env bash
# Installed root-owned as /usr/local/libexec/ames-documents-mcp.
set -euo pipefail
[[ $# == 0 ]] || exit 2
exec /usr/bin/env -i PATH=/usr/bin:/bin /usr/bin/docker exec -i \
  -e AMES_MCP_PROFILE=documents \
  -e 'AMES_MCP_ACTOR=IA · ames-documents' \
  ames-errantes-pi-espace-1 /usr/local/bin/node /app/services/mcp/documents.mjs
