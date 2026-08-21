import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline } from "@/lib/kv";
import { getRankedRowsForClubs } from "@/lib/rankedLive";
import { getCurrentSeason } from "@/lib/season";
import ClubView from "@/components/ClubView";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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

  const [allClubs, baseline, rankedRows] = await Promise.all([
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
    getRankedRowsForClubs([club]).catch(() => []),
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
      <Footer />
    </>
  );
}
