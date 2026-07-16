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

RUN groupadd --system --gid 1001 nodejs \
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

USER nextjs
EXPOSE 3000
VOLUME ["/data"]

CMD ["node", "server.js"]
