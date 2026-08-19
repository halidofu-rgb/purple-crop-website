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

## Architecture (résumé technique)

- **API de données** : API officielle Brawl Stars (`developer.brawlstars.com`), via le proxy IP fixe RoyaleAPI (voir Étape 1). Tout passe par `lib/brawlstars.ts` — c'est le seul fichier qui parle à l'API.
- **Cache** : chaque appel HTTP vers l'API est mis en cache 2 minutes (`next: { revalidate: 120 }` dans `bsFetch`). Next.js déduplique aussi automatiquement les appels identiques faits dans une même requête.
- **Stockage persistant** : Redis (intégration Vercel Marketplace), une seule clé par saison (`purplecorp:season-baseline:2026-08`, etc.) — jamais écrasée, l'historique des saisons passées reste consultable.
- **Ce qui est calculé en direct vs stocké** :
  - Trophées, classement, roster → toujours en direct depuis l'API (jamais stocké).
  - Push de saison → calculé en direct = trophées actuels − photo de départ stockée dans Redis.
  - Ranked → calculé en direct à partir des 25 derniers combats de chaque joueur (`/battlelog`), jamais stocké (l'API ne garde que cette fenêtre glissante).
- **Design system** : tokens centralisés dans `tailwind.config.ts` (classes utilitaires) et `app/globals.css` (variables CSS `--color-*`) — les deux doivent rester synchronisés si une couleur change. Composants partagés : `Button.tsx`, `Badge.tsx`, `Tabs.tsx`, `ClubBadge.tsx` (emblème généré, pas un asset du jeu), `Podium.tsx`, `RankGlyph.tsx`.

## Ce qui n'est PAS disponible (limite de l'API officielle, pas de notre code)

- Rang Ranked actuel d'un joueur (Masters, Légendaire, etc.) — Supercell ne l'expose pas.
- Score Ranked total, saison ou all-time — idem, aucun champ de ce type dans l'API.
- Classements "1v1" ou "Casino" — aucune donnée correspondante.
- Logo/badge réel du club — l'API ne renvoie qu'un `badgeId` numérique, pas d'image ; `ClubBadge.tsx` génère un emblème original à la place.
- Lien Discord d'un club — aucune donnée de ce type dans l'API (à ajouter manuellement si besoin, en dur dans `lib/clubs.ts`).

## Étape 5 — Connexion Discord (hub de connexion membres)

Permet à chaque membre de lier son compte Discord à son tag Brawl Stars, et
d'indiquer son score Ranked actuel (seule façon de l'obtenir, l'API ne le
fournit pas — voir /support).

1. Sur https://discord.com/developers/applications, crée une application.
2. Onglet **OAuth2 → General** : copie le **Client ID** et le **Client Secret**.
3. Toujours dans OAuth2, section **Redirects**, ajoute :
   `https://TON-SITE.vercel.app/api/auth/callback/discord`
4. Génère un secret aléatoire pour signer les sessions :
   ```
   openssl rand -base64 32
   ```
5. Dans Vercel → Environment Variables, ajoute :
   - `DISCORD_CLIENT_ID`
   - `DISCORD_CLIENT_SECRET`
   - `NEXTAUTH_SECRET` (le secret généré à l'étape 4)
   - `NEXTAUTH_URL` = l'URL exacte de ton site (`https://TON-SITE.vercel.app`)
6. Redéploie — le bouton "Connexion" apparaît dans la nav, et `/compte` permet à chaque membre de lier son compte.

**Important** : aucun bot Discord permanent n'est nécessaire pour cette fonctionnalité — c'est uniquement une connexion "Se connecter avec Discord" (OAuth), qui reste 100% hébergée sur Vercel. Un vrai bot avec des commandes Discord (`/profile`, etc.) est un projet séparé qui nécessiterait un hébergement dédié (Railway, Render...).
