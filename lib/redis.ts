// Client Redis partagé — utilisé par lib/kv.ts (saisons) ET lib/members.ts
// (liaisons de comptes Discord). Une seule connexion réutilisée entre les
// appels sur une même instance serverless "chaude".
import Redis from "ioredis";

let client: Redis | null = null;

export function getRedis(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error(
      "Aucune base Redis configurée (REDIS_URL manquante). Connecte l'intégration Redis depuis l'onglet Storage de ton projet Vercel (voir README)."
    );
  }
  if (!client) {
    client = new Redis(url);
  }
  return client;
}
