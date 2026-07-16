# Ultra audit — J'aime Besac Studio

Audit multi-agents (find → verify adversaire) + relecture manuelle intégrale, réalisé sur le commit
`c11ce5d`. 50 findings confirmés en double vérification + ~40 confirmés manuellement. Ce document
récapitule les défauts et l'état de correction (branche `fix/audit-p0-p1`).

L'app **compilait et buildait sans erreur** : tous les défauts étaient runtime / logique / sécurité /
données.

## 🔴 P0 — Critique (corrigé)

| # | Défaut | Correctif |
|---|--------|-----------|
| S1 | Aucune authentification sur aucune route API (lecture CRM, écrasement, effacement total par un anonyme) | Login email/mot de passe, cookie de session signé (HMAC), `src/proxy.ts` gardant toutes les pages + `/api/**`, garde en profondeur sur les routes workspace |
| S2 | Perte de données : édition possible pendant le chargement → `PUT` d'un état vide écrase tout | `loadedRef` dans le provider : aucune écriture tant que le chargement initial n'a pas réussi |

## 🟠 P1 — Élevé (corrigé)

| # | Défaut | Correctif |
|---|--------|-----------|
| S3 | SSRF via `rssUrl` arbitraire fetché côté serveur ; auth de sync *fail-open* | `net-guard.ts` (http/https + blocage IP internes/loopback/metadata), timeout + `redirect:"error"` + plafond ; `/api/news/sync` fail-closed (session **ou** `CRON_SECRET`) |
| S4 | Last-write-wins multi-onglets / cron ; échecs de sauvegarde avalés | Version par clé (ETag content-hash) + `409` sur conflit + compare-and-set SQLite transactionnel ; refetch au focus ; statut d'erreur non écrasable |
| S5 | Validation contournée (UI écrit via `PUT` générique sans schéma) → crash 500 / injection | Validation zod par clé dans `PUT /api/workspace/[key]` ; coalescence `null` côté SQLite |
| S6 | Dates décalées d'un jour (UTC vs local) | `dates.ts` réécrit sur fuseau fixe (`Europe/Paris`), DST-safe ; `today` recalculé par rendu |
| S7 | Relances en retard invisibles (statut `overdue` jamais calculé) | `lib/reminders.ts` `isOverdue()` dérivé à la lecture, utilisé partout (colonnes + métriques + badge) |
| — | `npm run news:sync` plante (`server-only`) | Le script appelle l'endpoint HTTP `/api/news/sync` avec `CRON_SECRET` |
| — | Modales/tiroirs sans focus-trap/Escape/role | Hook `useDialog` (Escape, focus trap, `role="dialog"`, restauration du focus) |
| — | Drag calendrier perd l'heure ; resize non persisté | `planning-calendar` transmet date+heure sur `eventDrop` et `eventResize` ; garde heure vide |
| — | Suppression de source/prestation sans confirmation | Modale de confirmation dans Paramètres |
| — | Bouton « Synchroniser » en 401 en prod | Résolu par la session (le fetch porte le cookie) |

## 🟡🟢 P2/P3 — Corrigés (sélection)

- Kanban tronqué (`slice(0,5)`) → toutes les colonnes affichées (publications & tournages).
- Publication depuis tournage : idempotente (garde sur `publicationId`), plus de régression de statut.
- Dashboard : « à venir » filtré `>= aujourd'hui` + trié ; « dont N » dérivé des données (plus de « 3 » codé en dur) ; libellés alignés.
- Stats : CA mensuel attribué au `createdAt` du client ; libellé « Ce mois-ci » honnête.
- Enum catégories réconcilié (« vie étudiante » accentué) → items étudiants de nouveau filtrables.
- `Label` avec `htmlFor` ; `CardHeader` `flex` ; lignes de table focusables au clavier.
- Transformations d'idées idempotentes (fermeture du drawer).
- « Source manuelle » réellement sélectionnable ; plus de `https://example.com` par défaut ; lien externe validé (protocole) ; ville « Besançon » cohérente ; recherche relances par type ; clés React d'historique uniques ; note de relance sans résurrection du statut.

## Résidus connus / hors périmètre

- DNS-rebinding (TOCTOU) sur le fetch RSS : le garde vérifie le DNS avant fetch ; un fix complet
  (pinning IP) est hors périmètre pour une app privée.
- Refonte CRUD item-level (au lieu de « tableau complet ») : au-delà de la concurrence 409.
- Historisation réelle du CA par facturation.
- PWA installable + Web Push (app mobile) : phase ultérieure.
