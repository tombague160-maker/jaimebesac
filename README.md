# J'aime Besac Studio

Application metier pour piloter J'aime Besac : CRM, veille locale, planning editorial, tournages, publications, relances, idees de contenus et statistiques.

## Demarrage local

```bash
npm install
npm run dev
```

Ouvrir `http://localhost:3000`. La base locale `dev.db` est creee automatiquement et reste ignoree par Git.

L'application demarre sans donnees d'exemple. Toutes les creations et tous les changements de statut sont sauvegardes automatiquement.

## Memoire de l'application

- En local : SQLite dans `dev.db`.
- Sur Vercel : Upstash Redis via `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`.
- Chaque module possede sa propre cle pour eviter qu'une modification du planning remplace le CRM, ou inversement.
- Un export JSON complet est disponible dans Parametres.

## Deploiement Vercel

1. Importer le depot dans Vercel.
2. Dans Vercel Marketplace, installer Upstash Redis et le connecter au projet.
3. Verifier que `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` ont ete ajoutes au projet.
4. Ajouter `WORKSPACE_ID=main`. Utiliser un identifiant different pour isoler plusieurs espaces dans la meme base Redis.
5. Deployer. Vercel execute automatiquement `npm run build`.

Sans les deux variables Upstash, l'API refuse volontairement d'utiliser le disque temporaire de Vercel afin d'eviter une fausse sauvegarde qui disparaitrait apres un redeploiement.

Pour des donnees clients reelles, activer aussi la protection d'acces du projet Vercel avant de rendre l'URL publique.

## Actualites

La veille ne scrape pas de pages web. Elle utilise :

- les actualites ajoutees manuellement ;
- les flux RSS actifs ajoutes dans Parametres ;
- le lien original de chaque source.

La synchronisation RSS classe les articles, calcule un score d'importance, suggere un angle editorial et ignore les doublons par URL.

## Verification

```bash
npm run lint
npm run build
npm run news:sync
```

`npm run news:sync` utilise la meme memoire que l'application et importe les flux RSS actifs.
