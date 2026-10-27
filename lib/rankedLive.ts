// Classements Ranked calculés en direct depuis l'API officielle (voir
// lib/brawlstars.ts) — un getPlayer() par membre de club, en parallèle.
// Remplace l'ancien suivi Redis (lib/rankedTracking.ts, retiré) devenu
// inutile depuis qu'on a confirmé que l'API renvoie déjà rankedElo &
// consorts (voir README, correction du 20/08/2026).
import { unstable_cache } from "next/cache";
import { getPlayer, Club, isNotFoundError, shouldRethrow } from "@/lib/brawlstars";

export interface RankedRow {
  tag: string;
  name: string;
  clubName: string;
  elo: number;
  rankName: string; // brut API, ex "DIAMOND III" — traduire avec rankLabelFromApi()
  bestElo: number;
  bestRankName: string;
}

// ~120 appels getPlayer() par calcul : c'est de loin le plus gros poste de
// CPU du site (chaque réponse joueur pèse des dizaines de Ko à parser). Le
// résultat — une centaine de petites lignes — est donc mis en cache 15 min
// et partagé entre toutes les pages et tous les visiteurs.
const fetchRankedRows = unstable_cache(
  async (members: { tag: string; clubName: string }[]): Promise<RankedRow[]> => {
    let failures = 0;
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
        } catch (err) {
          // Joueur introuvable = on l'ignore ; panne de l'API = on compte.
          if (!isNotFoundError(err)) failures++;
          return null;
        }
      })
    );

    // Trop d'échecs : on préfère faire échouer le calcul (donc ne RIEN mettre
    // en cache, et laisser la page garder sa dernière version valide) plutôt
    // que figer 5 minutes un classement amputé d'une partie des joueurs.
    if (shouldRethrow(new Error("api")) && failures > Math.max(3, members.length * 0.05)) {
      throw new Error(`Calcul Ranked abandonné : ${failures}/${members.length} appels en échec`);
    }

    return rows
      .filter((r): r is RankedRow => r !== null)
      .sort((a, b) => b.elo - a.elo);
  },
  ["ranked-rows"],
  { revalidate: 900 }
);

// clubs déjà chargés par la page appelante — on ne refait pas l'appel /clubs.
export async function getRankedRowsForClubs(clubs: Club[]): Promise<RankedRow[]> {
  const members = clubs.flatMap((club) =>
    club.members.map((m) => ({ tag: m.tag, clubName: club.name }))
  );
  return fetchRankedRows(members);
}
