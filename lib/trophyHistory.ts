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

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(earlier: string, later: string): number {
  return Math.round((Date.parse(`${later}T00:00:00Z`) - Date.parse(`${earlier}T00:00:00Z`)) / DAY_MS);
}

// Une absence d'au moins 30 jours = la joueuse a quitté puis est revenue :
// son push de saison repart de zéro à son retour (plus court, elle garde sa
// progression de la saison).
export const RETURN_GAP_DAYS = 30;
// Un point d'historique n'est "juste avant le reset" que s'il date de moins
// de 3 jours avant la date butoir : le cron tourne chaque jour.
const NEAR_CUTOFF_DAYS = 3;

// Valeur de départ de saison déduite de l'historique quotidien, ou null si
// l'historique ne permet pas de trancher (on garde alors la valeur actuelle).
//
// 1. Un point daté d'au plus 3 jours avant le reset (cutoffDate, inclus) :
//    les trophées juste avant le vrai reset de saison (9h UTC), alors que le
//    cron du jour peut tourner après et voir des trophées déjà gonflés.
//    Un vieux point (joueuse partie il y a des mois) ne compte PAS : c'était
//    le bug qui additionnait son ancien passage au push de la saison.
// 2. Sinon, une absence de 30 jours ou plus qui se termine après le reset :
//    la joueuse est revenue cette saison, on repart de son premier point de
//    retour.
export function baselineFromHistory(history: TrophyHistoryPoint[], cutoffDate: string): number | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const p = history[i];
    if (p.date <= cutoffDate && daysBetween(p.date, cutoffDate) <= NEAR_CUTOFF_DAYS) return p.trophies;
  }

  for (let i = history.length - 1; i > 0; i--) {
    const before = history[i - 1];
    const after = history[i];
    if (after.date > cutoffDate && daysBetween(before.date, after.date) >= RETURN_GAP_DAYS) {
      return after.trophies;
    }
  }

  return null;
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
