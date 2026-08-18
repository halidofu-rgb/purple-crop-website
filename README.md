# Purple Corp — site Brawl Stars

Site Next.js pour Purple Corp : Accueil, Clubs, Classement général et Pusheurs (qui progresse le plus).

## Pages

- `/` — Accueil, logo, trophées cumulés de tout Purple Corp
- `/clubs` — liste des clubs (Purple Line, Indigo Line)
- `/clubs/[tag]` — fiche détaillée d'un club (roster trié par trophées)
- `/classement` — classement global : tous les membres de tous les clubs, mélangés et triés
- `/pusheurs` — qui a gagné le plus de trophées depuis la dernière photo (nécessite l'étape Redis ci-dessous)

## Étape 1 — Clé API Brawl Stars

Voir la section équivalente du README précédent : va sur developer.brawlstars.com, crée une clé, **whiteliste l'IP `45.79.218.79`** (celle du proxy RoyaleAPI, pas la tienne).

## Étape 2 — Redis pour l'historique des pusheurs

La page `/pusheurs` a besoin d'un historique jour par jour, donc d'une petite base de données. Vercel KV a été remplacé par une intégration Marketplace (Upstash Redis), gratuite pour ce volume de données :

1. Dans ton projet sur vercel.com → onglet **Storage**.
2. **Create Database** (ou "Marketplace Database Providers") → choisis **Redis** (Upstash).
3. Suis l'assistant (région proche de toi, plan gratuit), **Create**.
4. Une fois créée, connecte-la à ton projet — Vercel va **injecter automatiquement** les variables d'environnement (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, ou parfois `KV_REST_API_URL` / `KV_REST_API_TOKEN` selon la version — le code gère les deux noms).

Aucune configuration supplémentaire nécessaire, `lib/kv.ts` s'en sert automatiquement.

## Étape 3 — Variables d'environnement

Dans **Settings → Environment Variables** sur Vercel (en plus de celles injectées par Redis) :

| Nom | Valeur |
|---|---|
| `BRAWL_STARS_API_KEY` | ta clé Brawl Stars |
| `CLUB_TAGS` | `#80CLJG9LQ,#2QJ0Q29CL` (tags de Purple Line et Indigo Line, virgule sans espace) |
| `CRON_SECRET` | une phrase secrète de ton choix (ex : un mot de passe généré aléatoirement) |

`CRON_SECRET` sert à empêcher que n'importe qui déclenche une capture en visitant l'URL — Vercel ajoute automatiquement l'en-tête d'autorisation correspondant quand le cron se déclenche.

## Étape 4 — La capture automatique quotidienne

Le fichier `vercel.json` déclare un Cron Job qui appelle `/api/cron/snapshot` chaque jour à 6h (heure UTC). Vercel l'active automatiquement au déploiement, rien à faire de plus.

**Pour tester tout de suite sans attendre le lendemain**, tu peux déclencher une capture manuelle en visitant, une fois déployé :
```
https://TON-SITE.vercel.app/api/cron/snapshot
```
(si tu as mis un `CRON_SECRET`, cette requête directe sans le bon header sera refusée — dans ce cas, retire temporairement `CRON_SECRET` de Vercel, teste, puis remets-le).

Fais-le **deux fois avec au moins un jour d'écart** (ou en modifiant temporairement des données pour tester) pour voir apparaître des écarts sur `/pusheurs` — avec une seule photo, la page t'indique qu'il faut attendre la suivante.

## Déploiement

Identique à avant :
```bash
npm install
git add .
git commit -m "Purple Corp : nav, classement, pusheurs"
git push
```
Vercel redéploie automatiquement à chaque push.

## Limites connues

- L'historique démarre à zéro à l'installation : les tout premiers jours, `/pusheurs` n'aura pas encore assez de photos.
- 60 photos maximum sont gardées (~2 mois), au-delà les plus anciennes sont supprimées automatiquement pour rester dans le plan gratuit.
