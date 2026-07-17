#!/bin/sh
set -e

# The app runs as the unprivileged "nextjs" user, but a bind-mounted /data
# (e.g. /srv/docker/jaimebesac/data on OMV) keeps the HOST directory's ownership,
# which is often root — so SQLite could not open its database and the UI showed
# "Impossible de charger les données". This entrypoint starts as root, makes the
# data dir writable by the app user, then drops privileges to run the server.

DATA_DIR="$(dirname "${DATABASE_URL#file:}")"
[ -z "$DATA_DIR" ] && DATA_DIR="/data"

mkdir -p "$DATA_DIR" 2>/dev/null || true
chown -R nextjs:nodejs "$DATA_DIR" 2>/dev/null || true

exec gosu nextjs "$@"
