# Purple Corp — site Brawl Stars

Site Next.js pour Purple Corp : Accueil, Clubs, Classement général et Pusheurs (qui progresse le plus).

## Pages

- `/` — Accueil, logo, trophées cumulés de tout Purple Corp
- `/clubs` — liste des clubs (Purple Line, Indigo Line, Iris Line)
- `/clubs/[tag]` — fiche détaillée d'un club (roster trié par trophées)
- `/classement` — classement global : tous les membres de tous les clubs, mélangés et triés
- `/pusheurs` — qui a gagné le plus de trophées depuis la dernière photo (nécessite l'étape Redis ci-dessous)
- `/actualites` — annonces du club / Brawl Stars, publiées à la main (voir Étape 9)

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
| `CLUB_TAGS` | `#80CLJG9LQ,#2QJ0Q29CL,#2Q29PJVYL` (tags de Purple Line, Indigo Line et Iris Line, virgule sans espace) |
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
  - Ranked (rang, Elo, record all-time) → champs renvoyés directement par `/players/{tag}`, jamais stocké. Les classements Ranked du site (`lib/rankedLive.ts`) appellent `getPlayer()` pour chaque membre en parallèle.
- **Design system** : tokens centralisés dans `tailwind.config.ts` (classes utilitaires) et `app/globals.css` (variables CSS `--color-*`) — les deux doivent rester synchronisés si une couleur change. Composants partagés : `Button.tsx`, `Badge.tsx`, `Tabs.tsx`, `ClubBadge.tsx` (emblème généré, pas un asset du jeu), `Podium.tsx`, `RankGlyph.tsx`.

## Ce qui n'est PAS disponible (limite de l'API officielle, pas de notre code)

- Classements "1v1" ou "Casino" — aucune donnée correspondante.
- Logo/badge réel du club — l'API ne renvoie qu'un `badgeId` numérique, pas d'image ; `ClubBadge.tsx` génère un emblème original à la place.
- Lien Discord d'un club — aucune donnée de ce type dans l'API (à ajouter manuellement si besoin, en dur dans `lib/clubs.ts`).

## Étape 5 — Connexion Discord (hub de connexion membres)

Permet à chaque membre de lier son compte Discord à son tag Brawl Stars, pour
retrouver facilement sa fiche et ajouter une présentation. Le Ranked affiché
sur `/compte` vient directement de l'API, aucune saisie requise.

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

## Correction du 20/08/2026 — le score Ranked EST dans l'API officielle

La recherche ci-dessous (menée avant cette date) concluait à tort que l'API officielle
n'exposait aucun champ Ranked. Vérifié par un appel réel à `/players/{tag}` le 20/08/2026 :
le payload contient bel et bien `rankedSeasonId`, `rankedRank`, `rankedRankName`, `rankedElo`,
`highestSeasonRankedRank(Name/Elo)` et `highestAllTimeRankedRank(Name/Elo)`. Supercell a dû
les ajouter après la publication des docs tierces qu'on avait consultées (aucune des sources
ci-dessous ne les mentionnait). `lib/brawlstars.ts` les type maintenant explicitement.

Tout le site a été migré vers ces vrais champs le même jour (fiche joueur, `/compte`,
`/classement`, `/clubs/[tag]`, accueil) via `lib/rankedLive.ts`, qui calcule les classements
Ranked en direct (un `getPlayer()` par membre, en parallèle) plutôt que de les stocker.
L'ancien suivi Redis (`lib/rankedTracking.ts`) et le cron `ranked-sync` qui l'alimentait ont
été retirés — devenus inutiles maintenant que la donnée vient directement de Supercell. La
section "Étape 6" ci-dessous décrit ce système, gardée pour l'historique.

## Recherche approfondie — score Ranked automatique (résultat, DÉPASSÉ — voir correction ci-dessus)

Vérification exhaustive menée : API officielle Brawl Stars, BrawlAPI (api.brawlapi.com),
Brawl Time Ninja (et ses 4 sources déclarées dans leur propre page /about : API officielle,
BrawlAPI, une autre lib tierce, le wiki Fandom), plusieurs libs tierces indépendantes
(brawlstats, bstats, BrawlPlex...).

**Conclusion (erronée, voir correction du 20/08/2026 ci-dessus) : aucune ne fournit le score
Ranked actuel ou all-time d'un joueur.** Même Brawl Time Ninja, qui l'affiche sur son site,
ne le tire d'aucune de ses 4 sources déclarées — ils font forcément leur propre suivi maison
en continu depuis des années, comme nous avec Redis, juste à bien plus grande échelle. La
saisie manuelle (`/compte`) reste donc la seule façon honnête d'avoir cette donnée sur Purple
Corp.

**Ce qui EST récupéré automatiquement depuis cette recherche :**
- Vraie icône de profil (`player.icon.id`) et vrai badge de club (`club.badgeId`), via
  BrawlAPI (`lib/assets.ts`) — CDN public explicitement conçu pour un usage tiers.
- Libellé de rang (Bronze I → Pro) calculé à partir du score Elo saisi, avec les vrais
  seuils du jeu confirmés par les notes de mise à jour Supercell (`lib/rankedTier.ts`).
  Ce n'est pas la donnée Ranked elle-même (toujours saisie à la main), juste sa traduction
  en nom de rang lisible.

**Pas de vraies icônes de rang (Bronze/Mythique/etc.)** : aucune source publique identifiée.
Brawl Time Ninja utilise ses propres images maison (hébergées sur son propre site, pas une
API ouverte) — rien de légitimement réutilisable trouvé pour l'instant.

## Étape 6 — Suivi Ranked automatique (ANCIEN SYSTÈME, retiré le 20/08/2026)

Gardé ici pour l'historique — ce système n'existe plus dans le code (voir la correction
plus haut). Avant qu'on découvre que l'API officielle expose directement `rankedElo` &
consorts, le site interrogeait en boucle le journal de combats (`/battlelog`, 25 derniers
combats) de chaque membre et accumulait les gains/pertes Ranked dans Redis — le principe
utilisé par les trackers communautaires qui n'ont pas accès à ces champs API.

- **Ranked (actuel)** = accumulation depuis le début du suivi. Démarre à 0
  pour chaque joueur au premier passage, grandit avec les vrais combats
  Ranked joués ensuite.
- **Ranked all-time** = maximum jamais atteint de ce compteur.

**Limite qu'avait ce système** : au tout début, tout le monde partait de 0 — impossible de
connaître le score réel au moment du démarrage. C'est précisément ce que la vraie donnée API
corrige : plus besoin d'accumuler quoi que ce soit, le score exact est disponible dès le
premier appel.

## Étape 7 — Icônes de rang réelles (à héberger toi-même)

Contrairement aux icônes de profil/club (BrawlAPI, déjà branchées automatiquement),
il n'existe aucune source publique légitime pour les vraies icônes de rang Ranked
(voir l'investigation complète plus haut). Pour les avoir quand même, il faut les
récupérer toi-même et les héberger sur le site, exactement comme le fait Projet X.

1. Va sur le wiki du jeu (brawlstars.fandom.com), section "Ranked" — chaque rang y a
   son icône.
2. Enregistre chaque image, renomme-la exactement comme dans `public/ranked-tiers/.gitkeep`
   (21 fichiers : bronze-1.png à masters-3.png).
3. Dépose-les dans `public/ranked-tiers/` (à côté de `logo.png`).
4. Rien d'autre à faire — le code (`components/RankTierIcon.tsx`) les affiche
   automatiquement dès qu'elles sont présentes, et retombe sur notre glyphe original
   tant qu'un fichier manque (jamais d'image cassée).

Ceci relève de la Fan Content Policy de Supercell (supercell.com/fan-content-policy),
comme tous les trackers communautaires qu'on a croisés dans cette recherche.

## Étape 8 — Trophée, couronne, push : mêmes principe

`public/icons/` fonctionne exactement comme `public/ranked-tiers/` (voir
Étape 7) : dépose `trophy.png`, `crown.png`, `push.png` et le site les
utilise automatiquement à la place de nos glyphes originaux, partout où
ils apparaissent (accueil, fiches club/joueur, classement, pusheurs).
Aucun fichier de code à modifier.

## Étape 9 — Actualités (`/actualites`)

Page d'annonces publiée à la main (club ou Brawl Stars), stockée dans Redis
(`lib/news.ts`) — pas de rédacteur automatique, pas de récupération externe.

Un seul compte Discord peut publier/supprimer, celui listé dans
`ADMIN_DISCORD_IDS` (variable d'environnement Vercel, un ou plusieurs ID
séparés par une virgule) :

1. Sur Discord : **Réglages utilisateur → Avancés → Mode développeur** (activer).
2. Clic droit sur ton propre profil (ou ton pseudo en haut à gauche) → **Copier l'ID utilisateur**.
3. Colle-le dans `ADMIN_DISCORD_IDS` sur Vercel, puis redéploie.

Une fois connecté avec ce compte Discord, un formulaire de publication apparaît
en haut de `/actualites` — titre, texte, image optionnelle (URL). Les visiteurs
non connectés voient uniquement la liste des actus, sans aucun contrôle.

## Étape 10 — Statistiques de visite (Vercel Web Analytics)

Le composant `<Analytics />` est branché dans `app/layout.tsx` (package
`@vercel/analytics`), mais il ne collecte rien tant que l'option n'est pas
activée côté Vercel :

1. Sur ton projet Vercel → onglet **Analytics** (menu de gauche).
2. Clique **Enable**.
3. Redéploie (le prochain push suffit).

Gratuit sur le plan Hobby avec une rétention limitée ; les visites remontent
dans l'onglet Analytics du dashboard Vercel, pas sur le site lui-même.
