// Historique jour par jour des trophées d'un joueur — alimenté par le même
// cron quotidien que la photo de saison (app/api/cron/snapshot), qui
// récupère de toute façon le roster complet chaque jour. Sert au petit
// graphique de progression sur la fiche joueur.
import { getRedis } from "@/lib/redis";

export interface TrophyHistoryPoint {
  date: string; // "2026-08-22"
  trophies: number;
}

// ~2 mois d'historique, comme l'ancien système de photos de pusheurs —
// suffisant pour une tendance, sans faire grossir Redis indéfiniment.
const MAX_POINTS = 60;

function historyKey(tag: string): string {
  return `purplecorp:trophy-history:${tag.toUpperCase().replace(/^#/, "")}`;
}

export async function getTrophyHistory(tag: string): Promise<TrophyHistoryPoint[]> {
  const redis = getRedis();
  const raw = await redis.get(historyKey(tag));
  if (!raw) return [];
  return (JSON.parse(raw) as TrophyHistoryPoint[]).sort((a, b) => a.date.localeCompare(b.date));
}

// Dernier point d'historique daté au plus tard "cutoffDate" (inclus) —
// sert à retrouver les trophées d'un joueur juste avant le vrai reset de
// saison (9h UTC), plutôt que ses trophées du moment où le cron tourne,
// qui peuvent déjà être après le reset si le passage quotidien arrive
// trop tard. Le cron capture toujours avant 9h UTC (voir vercel.json),
// donc un point daté "cutoffDate" est de toute façon antérieur au reset
// de ce jour-là. Retourne null si aucun point n'existe avant cette date
// (joueur trop récent pour avoir un historique).
export async function getTrophiesAtOrBefore(tag: string, cutoffDate: string): Promise<number | null> {
  const history = await getTrophyHistory(tag);
  const candidates = history.filter((p) => p.date <= cutoffDate);
  if (candidates.length === 0) return null;
  return candidates[candidates.length - 1].trophies;
}

// Idempotent : si le cron tourne deux fois le même jour, le point du jour
// est juste remplacé plutôt que dupliqué.
export async function recordTrophySnapshot(
  tag: string,
  trophies: number,
  date: string
): Promise<void> {
  const redis = getRedis();
  const key = historyKey(tag);
  const raw = await redis.get(key);
  const points: TrophyHistoryPoint[] = raw ? JSON.parse(raw) : [];
  const withoutToday = points.filter((p) => p.date !== date);
  const updated = [...withoutToday, { date, trophies }]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_POINTS);
  await redis.set(key, JSON.stringify(updated));
}
