// Classements Ranked calculés en direct depuis l'API officielle (voir
// lib/brawlstars.ts) — un getPlayer() par membre de club, en parallèle.
// Remplace l'ancien suivi Redis (lib/rankedTracking.ts, retiré) devenu
// inutile depuis qu'on a confirmé que l'API renvoie déjà rankedElo &
// consorts (voir README, correction du 20/08/2026).
import { getPlayer, Club } from "@/lib/brawlstars";

export interface RankedRow {
  tag: string;
  name: string;
  clubName: string;
  elo: number;
  rankName: string; // brut API, ex "DIAMOND III" — traduire avec rankLabelFromApi()
  bestElo: number;
  bestRankName: string;
}

// clubs déjà chargés par la page appelante — on ne refait pas l'appel /clubs.
export async function getRankedRowsForClubs(clubs: Club[]): Promise<RankedRow[]> {
  const members = clubs.flatMap((club) =>
    club.members.map((m) => ({ tag: m.tag, clubName: club.name }))
  );

  const rows = await Promise.all(
    members.map(async ({ tag, clubName }): Promise<RankedRow | null> => {
      try {
        const player = await getPlayer(tag);
        if (typeof player.rankedElo !== "number" || !player.rankedRankName) return null;
        return {
          tag: player.tag,
          name: player.name,
          clubName,
          elo: player.rankedElo,
          rankName: player.rankedRankName,
          bestElo: player.highestAllTimeRankedElo ?? player.rankedElo,
          bestRankName: player.highestAllTimeRankedRankName ?? player.rankedRankName,
        };
      } catch {
        return null;
      }
    })
  );

  return rows
    .filter((r): r is RankedRow => r !== null)
    .sort((a, b) => b.elo - a.elo);
}
