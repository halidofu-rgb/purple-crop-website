import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline } from "@/lib/kv";
import { listAllRankedTracking } from "@/lib/rankedTracking";
import { getCurrentSeason } from "@/lib/season";
import ClubView from "@/components/ClubView";
import Navbar from "@/components/Navbar";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClubPage({ params }: { params: { tag: string } }) {
  let club;
  try {
    club = await getClub(params.tag);
  } catch (err) {
    console.error(err);
    notFound();
  }

  const allTags = clubTags();
  const season = getCurrentSeason();

  const [allClubs, baseline, rankedTracking] = await Promise.all([
    Promise.all(
      allTags.map(async (tag) => {
        try {
          return await getClub(tag);
        } catch {
          return null;
        }
      })
    ),
    getSeasonBaseline(season.key).catch(() => null),
    listAllRankedTracking().catch(() => []),
  ]);

  const ranked = allClubs
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => b.trophies - a.trophies);
  const clubRank = ranked.findIndex((c) => c.tag === club.tag) + 1;

  const pushByTag = new Map<string, number>();
  if (baseline) {
    const baselineByTag = new Map(baseline.players.map((p) => [p.tag, p]));
    for (const m of club.members) {
      const before = baselineByTag.get(m.tag);
      if (before) pushByTag.set(m.tag, m.trophies - before.trophies);
    }
  }

  // Suivi Ranked automatique, filtré aux membres de CE club uniquement.
  const memberTags = new Set(club.members.map((m) => m.tag.toUpperCase()));
  const rankedRows = rankedTracking
    .filter((r) => memberTags.has(r.tag.toUpperCase()) && (r.current > 0 || r.allTimeBest > 0))
    .map((r) => ({
      tag: r.tag,
      name: r.name,
      rankedScore: r.current,
      rankedBest: r.allTimeBest,
    }))
    .sort((a, b) => b.rankedScore - a.rankedScore);

  return (
    <>
      <Navbar />
      <ClubView
        club={club}
        clubRank={clubRank || undefined}
        totalClubs={ranked.length}
        pushByTag={pushByTag}
        rankedRows={rankedRows}
        seasonLabel={season.label}
      />
    </>
  );
}
