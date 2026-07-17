# syntax=docker/dockerfile:1

# --- Builder -------------------------------------------------------------
# Debian slim (glibc) avoids musl issues with the native better-sqlite3 module.
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Build toolchain for compiling native modules (better-sqlite3) if no prebuilt.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Baked into the client bundle at build time (NEXT_PUBLIC_*), so the app timezone
# is consistent between server and browser. Override with --build-arg if needed.
ARG NEXT_PUBLIC_APP_TIMEZONE=Europe/Paris
ENV NEXT_PUBLIC_APP_TIMEZONE=$NEXT_PUBLIC_APP_TIMEZONE
RUN npm run build

# --- Runner --------------------------------------------------------------
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# SQLite lives in the mounted /data volume.
ENV DATABASE_URL=file:/data/dev.db

# gosu lets the entrypoint drop from root to the app user after fixing /data perms.
RUN apt-get update && apt-get install -y --no-install-recommends gosu \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p /data \
  && chown -R nextjs:nodejs /data

# Standalone server output + assets.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Safety net: ensure the native better-sqlite3 binary is present in the runtime
# image even if output tracing missed it.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# NOTE: runs as root so the entrypoint can chown the (possibly root-owned) bind
# mount /data, then drops to the unprivileged "nextjs" user via gosu.
EXPOSE 3000
VOLUME ["/data"]

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]
