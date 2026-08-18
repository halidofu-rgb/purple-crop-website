# Site club Brawl Stars

Petit site Next.js qui affiche en direct les trophées et le classement de ton club (et de tes potes), sur le même principe que le site "Projet X" que tu m'as montré.

## Comment ça marche

- **Next.js** génère les pages. La page d'accueil affiche ton club (tag défini dans `CLUB_TAG`), et `/clubs/UN_AUTRE_TAG` affiche n'importe quel autre club.
- Le code appelle l'**API officielle Brawl Stars**, mais jamais directement depuis le navigateur : tout passe par une fonction serveur (`lib/brawlstars.ts`), donc ta clé API n'est jamais visible par les visiteurs.
- Comme Vercel n'a pas d'IP fixe, on passe par le **proxy gratuit de RoyaleAPI** (`bsproxy.royaleapi.dev`), qui a lui une IP fixe. C'est la méthode standard recommandée par Supercell pour ce cas — pas un contournement bricolé.

## Étape 1 — Créer ta clé API Brawl Stars

1. Va sur https://developer.brawlstars.com et connecte-toi avec ton compte Supercell.
2. "My Account" → "Create New Key".
3. Nom : ce que tu veux (ex. "Site club").
4. **IP à whitelister : `45.79.218.79`** (c'est l'IP du proxy RoyaleAPI, pas la tienne — sinon rien ne fonctionnera une fois déployé). Vérifie sur https://docs.royaleapi.com/proxy.html que cette IP est toujours la bonne au moment où tu le fais, RoyaleAPI la documente et la met à jour si besoin.
5. Crée la clé, copie-la (tu ne la reverras qu'une fois).

## Étape 2 — Lancer le site en local

```bash
npm install
cp .env.example .env.local
```

Puis dans `.env.local` :
```
BRAWL_STARS_API_KEY=colle_ta_clé_ici
CLUB_TAG=#TONTAGDECLUB
```

```bash
npm run dev
```

→ http://localhost:3000

## Étape 3 — Déployer sur Vercel

1. Crée un repo GitHub avec ce projet (`git init`, `git add .`, `git commit`, push).
2. Sur https://vercel.com → "Add New Project" → importe le repo.
3. Dans **Settings → Environment Variables**, ajoute :
   - `BRAWL_STARS_API_KEY` → ta clé
   - `CLUB_TAG` → le tag de ton club
4. Deploy. C'est tout — Vercel redéploie automatiquement à chaque push.

## Ajouter tes potes / plusieurs clubs

- Un joueur : la fonction `getPlayer(tag)` dans `lib/brawlstars.ts` est prête, il ne reste qu'à créer une page `app/joueurs/[tag]/page.tsx` sur le modèle de `app/clubs/[tag]/page.tsx`.
- Un autre club : va directement sur `/clubs/AUTRE_TAG`, aucune config nécessaire.

## Limites à connaître

- L'API Brawl Stars n'expose pas d'historique : tu ne peux afficher que l'état actuel (trophées, membres, rang ranked), pas de graphique d'évolution sans stocker toi-même les données dans le temps (ex. via une petite base + un cron Vercel qui interroge l'API chaque jour).
- Le cache est réglé à 2 minutes (`revalidate: 120` dans `lib/brawlstars.ts`) pour ne pas spammer l'API à chaque visite.
