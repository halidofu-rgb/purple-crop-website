import { getClub, getRankedSummary } from "@/lib/brawlstars";

export interface RankedRow {
  tag: string;
  name: string;
  clubName: string;
  delta: number;
  wins: number;
  losses: number;
  games: number;
}

// Interroge le battlelog de CHAQUE membre (25 derniers combats chacun) pour
// construire un classement Ranked. Coûteux en appels API, mais mis en cache
// 2 minutes côté Next (voir lib/brawlstars.ts) donc acceptable pour ce volume.
export async function getRankedRows(tags: string[]): Promise<RankedRow[]> {
  const clubs = await Promise.all(
    tags.map(async (tag) => {
      try {
        return await getClub(tag);
      } catch {
        return null;
      }
    })
  );

  const members = clubs
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .flatMap((club) => club.members.map((m) => ({ ...m, clubName: club.name })));

  const rows = await Promise.all(
    members.map(async (m) => {
      try {
        const summary = await getRankedSummary(m.tag);
        return { tag: m.tag, name: m.name, clubName: m.clubName, ...summary };
      } catch {
        return { tag: m.tag, name: m.name, clubName: m.clubName, delta: 0, wins: 0, losses: 0, games: 0 };
      }
    })
  );

  return rows.filter((r) => r.games > 0).sort((a, b) => b.delta - a.delta);
}
