// Stocke UNE photo des trophées de chaque membre au début de chaque saison
// Brawl Stars (1er jeudi du mois). La page /pusheurs compare les trophées
// actuels à cette photo pour savoir qui a le plus progressé "depuis le
// début de la saison" — exactement comme le classement "Roi du push".
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

export interface BaselinePlayer {
  tag: string;
  name: string;
  trophies: number;
  clubName: string;
}

export interface SeasonBaseline {
  seasonKey: string; // ex: "2026-08"
  capturedAt: string; // ISO — utile pour savoir si la photo date bien du début de saison
  players: BaselinePlayer[];
}

function baselineKey(seasonKey: string): string {
  return `purplecorp:season-baseline:${seasonKey}`;
}

export async function getSeasonBaseline(seasonKey: string): Promise<SeasonBaseline | null> {
  const redis = getRedis();
  const raw = await redis.get(baselineKey(seasonKey));
  if (!raw) return null;
  return (typeof raw === "string" ? JSON.parse(raw) : raw) as SeasonBaseline;
}

export async function setSeasonBaseline(baseline: SeasonBaseline): Promise<void> {
  const redis = getRedis();
  // Pas de TTL : on garde les baselines passées, ça ne coûte presque rien
  // en stockage et ça permet de consulter d'anciennes saisons plus tard.
  await redis.set(baselineKey(baseline.seasonKey), JSON.stringify(baseline));
}
