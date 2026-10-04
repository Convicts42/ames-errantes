FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY services ./services
COPY ame-errante/package.json ./ame-errante/package.json
COPY ames-errantes-interne/package.json ./ames-errantes-interne/package.json
RUN pnpm install --frozen-lockfile
COPY ame-errante ./ame-errante
COPY ames-errantes-interne ./ames-errantes-interne
COPY scripts ./scripts
COPY tests ./tests
RUN pnpm --filter ame-errante build && pnpm --filter ames-errantes-interne build

FROM postgres:18-bookworm AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends libstdc++6 && rm -rf /var/lib/apt/lists/* && useradd --uid 1000 --create-home app && mkdir -p /data/backups && chown -R app:app /data
COPY --from=build /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY --from=build --chown=app:app /app /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PUBLIC_ASSETS_ROOT=/app/ame-errante/public APP_DATA=/data BACKUP_DIRECTORY=/data/backups
USER app
ENTRYPOINT []
