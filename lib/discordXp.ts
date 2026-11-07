// Activité Discord par saison, mesurée en XP DraftBot gagnée.
//
// DraftBot ne donne que l'XP totale du moment (aucun historique). On en prend
// donc une photo chaque jour (même cron que les trophées) et on garde :
// - le départ de la saison : la photo du jour du reset, ou la plus proche
//   dans les 3 jours d'avant, sinon la première photo disponible ;
// - la fin de la saison : la photo de départ de la saison suivante.
// XP gagnée = XP actuelle (ou de fin) - XP de départ. Un membre absent de la
// photo de départ (arrivé ou premier message depuis) part de 0.
import { getRedis } from "@/lib/redis";
import { previousSeasonKey } from "@/lib/season";

export type XpMap = Record<string, number>; // id Discord -> XP totale

export interface XpBaseline {
  seasonKey: string;
  capturedAt: string;
  /** Date (AAAA-MM-JJ) de la photo utilisée comme départ. */
  sourceDate: string;
  /** true si la photo date du début de saison (au plus 3 jours avant/au reset). */
  exact: boolean;
  users: XpMap;
}

const SNAPSHOT_TTL_SECONDS = 120 * 24 * 60 * 60; // ~4 mois, de quoi couvrir une saison
const NEAR_START_DAYS = 3;

const snapKey = (date: string) => `purplecorp:discord-xp:snap:${date}`;
const baselineKey = (season: string) => `purplecorp:discord-xp:baseline:${season}`;
const finalKey = (season: string) => `purplecorp:discord-xp:final:${season}`;

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function recordXpSnapshot(date: string, users: XpMap): Promise<void> {
  await getRedis().set(snapKey(date), JSON.stringify(users), "EX", SNAPSHOT_TTL_SECONDS);
}

async function getSnapshot(date: string): Promise<XpMap | null> {
  const raw = await getRedis().get(snapKey(date));
  return raw ? (JSON.parse(raw) as XpMap) : null;
}

export async function getXpBaseline(seasonKey: string): Promise<XpBaseline | null> {
  const raw = await getRedis().get(baselineKey(seasonKey));
  return raw ? (JSON.parse(raw) as XpBaseline) : null;
}

export async function getXpFinal(seasonKey: string): Promise<XpMap | null> {
  const raw = await getRedis().get(finalKey(seasonKey));
  return raw ? (JSON.parse(raw) as XpMap) : null;
}

// Crée la photo de départ de la saison si elle n'existe pas encore (appelée par
// le cron, après l'enregistrement de la photo du jour). Ne remplace jamais une
// photo existante. À la création, la même photo sert aussi de fin à la saison
// précédente.
export async function ensureXpBaseline(
  seasonKey: string,
  cutoffDate: string,
  today: string,
  todayUsers: XpMap
): Promise<{ created: boolean; baseline: XpBaseline }> {
  const existing = await getXpBaseline(seasonKey);
  if (existing) return { created: false, baseline: existing };

  let users = todayUsers;
  let sourceDate = today;
  let exact = false;
  for (let i = 0; i <= NEAR_START_DAYS; i++) {
    const date = shiftDate(cutoffDate, -i);
    if (date > today) continue;
    const snap = await getSnapshot(date);
    if (snap) {
      users = snap;
      sourceDate = date;
      exact = true;
      break;
    }
  }

  const baseline: XpBaseline = {
    seasonKey,
    capturedAt: new Date().toISOString(),
    sourceDate,
    exact,
    users,
  };
  const redis = getRedis();
  await redis.set(baselineKey(seasonKey), JSON.stringify(baseline));

  // Seulement si la saison précédente était suivie (a une photo de départ).
  const prevKey = previousSeasonKey(seasonKey);
  if (await getXpBaseline(prevKey)) {
    await redis.set(finalKey(prevKey), JSON.stringify(users));
  }
  return { created: true, baseline };
}
