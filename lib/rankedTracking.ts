// Suivi Ranked 100% automatique, par tag Brawl Stars — sans saisie
// manuelle, sans lien Discord requis. Même principe que Projet X et
// BrawlTools : l'API officielle ne donne aucun score Ranked absolu, donc
// on interroge en boucle le journal de combats (/battlelog, 25 derniers
// combats) et on accumule les gains/pertes Ranked dans notre propre base.
//
// "current" = accumulation depuis le début du suivi (jamais un vrai score
// absolu — on ne peut pas connaître le point de départ). "allTimeBest" =
// maximum jamais atteint de ce compteur, robuste même si un passage de
// synchro est manqué.
import { getRedis } from "@/lib/redis";
import { getBattleLog, parseBattleTime } from "@/lib/brawlstars";

export interface RankedTracking {
  tag: string;
  name: string;
  clubName: string;
  current: number;
  allTimeBest: number;
  lastBattleTime?: string; // ISO — pour ne jamais recompter un combat déjà traité
  updatedAt: string;
}

function key(tag: string): string {
  return `purplecorp:ranked-tracking:${tag.toUpperCase().replace(/^#/, "")}`;
}

export async function getRankedTracking(tag: string): Promise<RankedTracking | null> {
  const redis = getRedis();
  const raw = await redis.get(key(tag));
  return raw ? (JSON.parse(raw) as RankedTracking) : null;
}

async function saveRankedTracking(entry: RankedTracking): Promise<void> {
  const redis = getRedis();
  await redis.set(key(entry.tag), JSON.stringify(entry));
}

export async function listAllRankedTracking(): Promise<RankedTracking[]> {
  const redis = getRedis();
  const keys = await redis.keys("purplecorp:ranked-tracking:*");
  if (keys.length === 0) return [];
  const raw = await redis.mget(...keys);
  return raw.filter((r): r is string => r !== null).map((r) => JSON.parse(r) as RankedTracking);
}

// Appelée par le cron pour un joueur donné : ajoute les gains/pertes des
// combats Ranked survenus depuis la dernière synchro.
export async function syncRankedTracking(
  tag: string,
  name: string,
  clubName: string
): Promise<void> {
  const existing = await getRankedTracking(tag);
  const since = existing?.lastBattleTime ? new Date(existing.lastBattleTime) : null;

  const battles = await getBattleLog(tag);
  const rankedBattles = battles.filter((b) => b.battle.type?.toLowerCase().includes("ranked"));

  const newBattles = since
    ? rankedBattles.filter((b) => parseBattleTime(b.battleTime) > since)
    : rankedBattles; // premier passage : on prend ce qu'on a, le point de départ est 0

  if (!since) {
    // Premier passage pour ce joueur : on démarre à 0, on ne compte pas
    // les combats déjà joués avant qu'on commence à suivre (impossible de
    // savoir où il en était avant).
    const latest = rankedBattles[0]?.battleTime;
    await saveRankedTracking({
      tag,
      name,
      clubName,
      current: 0,
      allTimeBest: 0,
      lastBattleTime: latest ? new Date(parseBattleTime(latest).getTime() + 1000).toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  if (newBattles.length === 0) {
    // Rien de nouveau, mais on met à jour le nom/club au cas où ils ont changé.
    await saveRankedTracking({ ...existing!, name, clubName, updatedAt: new Date().toISOString() });
    return;
  }

  const delta = newBattles.reduce((sum, b) => sum + (b.battle.trophyChange ?? 0), 0);
  const newCurrent = Math.max(0, existing!.current + delta);
  const latestBattleTime = newBattles.reduce(
    (max, b) => (parseBattleTime(b.battleTime) > max ? parseBattleTime(b.battleTime) : max),
    since!
  );

  await saveRankedTracking({
    tag,
    name,
    clubName,
    current: newCurrent,
    allTimeBest: Math.max(existing!.allTimeBest, newCurrent),
    lastBattleTime: latestBattleTime.toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
