# Ultra audit #2 — code · architecture · design

Audit du code actuel (post-sécurisation/déploiement) par 3 passes en lecture seule
(correction/sécurité, architecture, design) + relecture ciblée. **Build/tsc/lint verts, auth solide,
aucun P0/P1 exploitable par un anonyme.** Corrigé par lots (S → A → D → R).

## Lot S — Sécurité & données *(fait)*

| # | Défaut | Fichier | Correctif |
|---|--------|---------|-----------|
| S1 | Bypass SSRF IPv6-mapped **hex** (`::ffff:a9fe:a9fe` = 169.254.169.254 non bloqué) | `lib/net-guard.ts` | Expansion IPv6 complète (`expandV6`) → décode l'IPv4 mappée en hex et la bloque. Testé 14/14. |
| S2 | Open-redirect via backslash (`/\evil.com`) | `app/login/page.tsx` | Validation par `new URL(from, origin).origin === origin`. |
| S3 | Synchro RSS écrase les éditions UI concurrentes (write non versionné) | `lib/news/sync-news-sources.ts` | Merge par `originalUrl` + compare-and-set + retry (5×). |
| S4 | État optimiste non annulé sur échec de sauvegarde (hors 409) | `components/workspace-provider.tsx` | Revert de la valeur optimiste sur échec non-conflit. |
| S5 | Écriture sans `version` = écrasement aveugle | `app/api/workspace/[key]/route.ts` | `version` **obligatoire** (428 si absente). Testé. |
| S6 | `newsItems` croît sans borne → 413 | `lib/news/sync-news-sources.ts` | Plafond `NEWS_MAX_ITEMS` (1000 par défaut). |
| S7 | `publishedAt` RSS daté en UTC | `lib/news/sync-news-sources.ts` | `toDateOnly()` (fuseau app). |
| S8 | Login sans limite d'essais | `app/api/auth/login/route.ts` + `lib/rate-limit.ts` | Throttle par IP (10 échecs / 15 min → 429). Testé. |
| S9 | CAS Redis non atomique | `lib/workspace-store.ts` | Documenté (SQLite = atomique ; Redis best-effort). |
| S10 | Matcher proxy trop large (`.*\.json$` à toute profondeur) | `src/proxy.ts` | Restreint aux fichiers statiques de 1er niveau. |

## Lot A — Architecture *(à venir)*
- A1 : supprimer les routes REST mortes (`/api/clients`, `/api/news*` sauf `sync`) + `lib/validation.ts` (~289 l., jamais appelées).
- A2 : factoriser `Info` ×7, `Metric` ×7, `ViewButton` ×3 dans `components/ui/`.
- A3 : remplacer les casts `form.get() as <Union>` (~15) par des parseurs zod.
- A4 : sélecteurs pour éviter le re-render global du contexte.

## Lot D — Design & UX *(à venir)*
- D1 : tokeniser ~385 couleurs hex (21 fichiers) via `@theme` (Tailwind v4).
- D2 : mode sombre. D3 : skeletons. D4 : états vides cohérents. D5 : contrastes AA.
- D6 : réglage densité (brancher ou retirer). D7 : `font-black` maîtrisé, kanban unifié, cibles ≥44px, double `<h1>`.

## Lot R — Refactor structurel *(à venir, différable)*
- R1 : persistance/CRUD par entité (au lieu du document entier par module). R2 : rendu initial serveur.
