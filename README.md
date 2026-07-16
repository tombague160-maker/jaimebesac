# J'aime Besac Studio

Application métier pour piloter J'aime Besac : CRM, veille locale, planning éditorial, tournages, publications, relances, idées de contenus et statistiques.

> **Application privée.** L'accès est protégé par un identifiant (email + mot de passe). Toutes les
> pages et toutes les routes API exigent une session valide.

## Démarrage local

```bash
npm install
cp .env.example .env
npm run auth:hash -- "mon-mot-de-passe"   # colle le hash affiché dans .env (AUTH_PASSWORD_HASH)
# renseigne aussi AUTH_EMAIL et SESSION_SECRET (openssl rand -hex 32) dans .env
npm run dev
```

Ouvrir `http://localhost:3000` → tu es redirigé vers `/login`. La base locale `dev.db` est créée
automatiquement et reste ignorée par Git.

L'application démarre sans données d'exemple. Toutes les créations et tous les changements de statut
sont sauvegardés automatiquement.

## Authentification

- Un seul compte : `AUTH_EMAIL` + `AUTH_PASSWORD_HASH` (hash scrypt généré par `npm run auth:hash`).
- Session : cookie signé `httpOnly` (HMAC via `SESSION_SECRET`), durée `SESSION_TTL_SECONDS` (30 j par défaut).
- Le proxy (`src/proxy.ts`) bloque tout accès non authentifié ; les routes workspace re-vérifient la session (défense en profondeur).

## Mémoire de l'application

- Self-host / local : **SQLite** dans le volume `/data` (`DATABASE_URL=file:/data/dev.db`). Sauvegarde = copie du fichier.
- Sur Vercel : Upstash Redis via `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`.
- Chaque module possède sa propre clé, avec un **numéro de version** (ETag) : une sauvegarde concurrente renvoie `409` au lieu d'écraser silencieusement (anti-perte de données multi-onglets).
- Un export JSON complet est disponible dans Paramètres.

## Déploiement Docker (serveur OMV / Linux)

Prérequis : Docker + Docker Compose.

```bash
cp .env.example .env
# Renseigne AUTH_EMAIL, AUTH_PASSWORD_HASH (npm run auth:hash), SESSION_SECRET, CRON_SECRET.
docker compose build
docker compose up -d
```

- L'app écoute sur `http://<hôte>:${APP_PORT:-3000}`. Santé : `GET /api/health`.
- Les données SQLite persistent dans le volume nommé `jaimebesac-data` (monté sur `/data`).
  Sauvegarde : `docker run --rm -v jaimebesac-data:/data -v "$PWD":/backup busybox tar czf /backup/jaimebesac-data.tgz /data`.
- **Avant d'exposer sur le web** : place l'app derrière un reverse proxy HTTPS (SWAG / nginx / Caddy).
  Le cookie de session est `secure` en production, donc **HTTPS est requis** pour se connecter.

### Déploiement OMV par image (recommandé sur NAS) — `docker-compose.omv.yml`

Sur un NAS on tire une image prête à l'emploi (comme Jellyfin) plutôt que de builder sur place.
Le fichier **`docker-compose.omv.yml`** est prêt pour ça (pull GHCR + bind mount `/srv/docker/jaimebesac/data`) ;
son en-tête liste les étapes. En résumé :

1. Publier l'image : onglet **Actions → Publish Docker image → Run workflow** (ou pousser un tag `v*`).
   Rendre ensuite le package GHCR **public** (ou `docker login ghcr.io` sur l'OMV).
2. `sudo mkdir -p /srv/docker/jaimebesac/data && sudo chown -R 1001:1001 /srv/docker/jaimebesac/data`
   (l'app tourne en uid 1001).
3. Remplir les secrets dans le fichier, puis :

```bash
docker compose -f docker-compose.omv.yml up -d
docker compose -f docker-compose.omv.yml pull   # pour mettre à jour ensuite
```

`docker-compose.yml` (avec `build: .`) reste utile pour builder localement / sur une machine avec le code.

## Actualités

La veille ne scrape pas de pages web. Elle utilise les actualités ajoutées manuellement et les flux RSS
actifs ajoutés dans Paramètres. La synchronisation classe les articles, calcule un score d'importance,
suggère un angle éditorial et ignore les doublons par URL.

Sécurité : les URL de flux sont validées avant le fetch (http/https uniquement, adresses internes/loopback
bloquées → anti-SSRF), avec timeout et plafond de sources.

### Cron de synchronisation

`/api/news/sync` accepte une session connectée **ou** un `Authorization: Bearer <CRON_SECRET>`.

```bash
APP_URL=https://mon-app CRON_SECRET=xxx npm run news:sync
# ou directement :
curl -X POST https://mon-app/api/news/sync -H "Authorization: Bearer xxx"
```

## Vérification

```bash
npm run lint
npx tsc --noEmit
npm run build
```
