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

## Lot A — Architecture *(fait)*
- A1 ✅ : routes REST mortes supprimées (`/api/clients`, `/api/clients/[id]`, `/api/news`, `/api/news/[id]`, `/api/news/sources`) + `lib/validation.ts` — ~289 lignes jamais appelées.
- A2 ✅ : `Info` (×7), `Metric` (×7), `ViewButton` (×3) factorisés dans `components/ui/{info-row,metric,view-toggle}.tsx` (foundation aussi pour la tokenisation du Lot D).
- A3 (reporté/faible) : les casts `form.get() as <Union>` sont alimentés par des `<Select>` aux options fixes → valeurs déjà contraintes en pratique ; la validation par élément est traitée au grain du `PUT` (Lot S) et le sera plus finement au Lot R.
- A4 (fusionné dans R) : les sélecteurs/re-render ciblés relèvent de la refonte de persistance (Lot R).

## Lot D — Design & UX *(partie 1 faite)*
- D1 ✅ : **tokenisation** — système de tokens sémantiques dans `@theme` (Tailwind v4, `globals.css`), 367 classes `[#hex]` remplacées par des utilitaires (`text-ink`, `bg-card`, `border-line`…). Look clair **strictement identique** (vérifié Playwright).
- D2 ✅ : **mode sombre** complet — surcharge des tokens sous `.dark`, bouton de bascule (`ui/theme-toggle.tsx`, `useSyncExternalStore`), script anti-flash dans `layout.tsx`, persistance localStorage + respect du système. Overlays/scrollbar/calendrier adaptés. Vérifié clair + sombre.
- D5 ✅ (via tokens) : eyebrows → `--eyebrow` (#287CA8, AA) ; `muted-soft` remonté (#6B7A85).
- D6 ✅ : réglage « densité » mort **retiré** (il était trompeur).
- D4 ✅ : `EmptyState` partagé (`ui/empty-state.tsx`) branché sur les 4 grilles principales (clients, tournages, news, idées) — distingue « aucune donnée » de « aucun résultat de filtre ».
- D3 ✅ : barre de chargement globale sous le header (indicateur pendant le chargement, au lieu du flash de zéros).
- D7 ✅ (l'essentiel) : double `<h1>` corrigé (titre du shell → `<p>`), **kanban clients unifié** (flex + toutes les colonnes), table clients accessible au clavier, panneau « Changer le statut » complet (partner/former/lost enfin atteignables). Différé (large/subjectif) : réduction globale de `font-black`, cibles tactiles ≥44px partout.

## Lot R — Refactor structurel
- R2 ✅ : **rendu serveur des données** — le layout racine (authentifié uniquement) lit le workspace côté
  serveur et seed le provider : les pages arrivent **avec** leurs chiffres (plus de flash de zéros ni de
  fetch initial). Échec de lecture → repli sur le fetch client (bannière + réessayer). Un visiteur déjà
  connecté qui ouvre `/login` est redirigé vers l'app. Vérifié : SSR avec données, zéro fuite sur `/login`,
  redirections, écritures avec versions seedées, hydratation sans erreur + revue adversaire 5 angles
  (1 finding P2 corrigé : date du header ancrée sur Europe/Paris).
- R1 (différé, décision produit) : persistance/CRUD **par élément** (au lieu du document entier par module).
  Pertinent si multi-utilisateurs ou volumétrie forte ; pour un usage mono-utilisateur, le versionnage par
  module + 409 couvre déjà la concurrence, et la migration du stockage en prod porte un risque réel de
  perte pour un bénéfice marginal. À trancher explicitement avant toute mise en chantier.
