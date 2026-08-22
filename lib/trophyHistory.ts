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
