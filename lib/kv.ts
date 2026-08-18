// Petite couche au-dessus de Redis (Upstash) pour stocker un historique
// quotidien des trophées de chaque membre. Sans ça, impossible de savoir
// qui "pushe" : l'API Brawl Stars ne donne que l'instant présent.
//
// Les identifiants sont injectés automatiquement par Vercel quand tu
// ajoutes l'intégration Redis (Marketplace). Selon la convention utilisée
// au moment où tu l'installes, les variables peuvent s'appeler
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN ou
// KV_REST_API_URL / KV_REST_API_TOKEN — on gère les deux.
import { Redis } from "@upstash/redis";

function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Aucune base Redis configurée. Installe l'intégration Redis depuis l'onglet Storage de ton projet Vercel (voir README)."
    );
  }

  return new Redis({ url, token });
}

const SNAPSHOTS_KEY = "purplecorp:snapshots";
const MAX_SNAPSHOTS = 60; // ~2 mois d'historique à raison d'une photo/jour

export interface SnapshotPlayer {
  tag: string;
  name: string;
  trophies: number;
  clubName: string;
}

export interface Snapshot {
  date: string; // ISO
  players: SnapshotPlayer[];
}

export async function pushSnapshot(snapshot: Snapshot): Promise<void> {
  const redis = getRedis();
  await redis.lpush(SNAPSHOTS_KEY, JSON.stringify(snapshot));
  await redis.ltrim(SNAPSHOTS_KEY, 0, MAX_SNAPSHOTS - 1);
}

// Renvoie les snapshots du plus récent au plus ancien.
export async function getSnapshots(count: number): Promise<Snapshot[]> {
  const redis = getRedis();
  const raw = await redis.lrange(SNAPSHOTS_KEY, 0, count - 1);
  return raw.map((r) => (typeof r === "string" ? JSON.parse(r) : r)) as Snapshot[];
}
