import { getClub, ClubMember } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline } from "@/lib/kv";
import { getRankedRowsForClubs, RankedRow } from "@/lib/rankedLive";
import { rankLabelFromApi } from "@/lib/rankedTier";
import { getCurrentSeason } from "@/lib/season";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Tabs from "@/components/Tabs";
import PageBanner from "@/components/PageBanner";
import ClassementBoard, { ClassementEntry } from "@/components/ClassementBoard";
import { TrophyGlyph, RankedGlyph } from "@/components/icons";

export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

interface TrophyRow extends ClubMember {
  clubName: string;
}

export default async function ClassementPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const tags = clubTags();
  const season = getCurrentSeason();

  const clubs = await Promise.all(
    tags.map(async (tag) => {
      try {
        return await getClub(tag);
      } catch {
        return null;
      }
    })
  );

  const loadedClubs = clubs.filter((c): c is NonNullable<typeof c> => c !== null);

  const [baseline, rankedByCurrent] = await Promise.all([
    getSeasonBaseline(season.key).catch(() => null),
    getRankedRowsForClubs(loadedClubs).catch(() => []),
  ]);

  const rankedByBest = [...rankedByCurrent].sort((a, b) => b.bestElo - a.bestElo);

  const trophyRows: TrophyRow[] = loadedClubs
    .flatMap((club) => club.members.map((m) => ({ ...m, clubName: club.name })))
    .sort((a, b) => b.trophies - a.trophies);

  const pushByTag = new Map<string, number>();
  if (baseline) {
    const baselineByTag = new Map(baseline.players.map((p) => [p.tag, p]));
    for (const m of trophyRows) {
      const before = baselineByTag.get(m.tag);
      if (before) pushByTag.set(m.tag, m.trophies - before.trophies);
    }
  }

  const totalTrophies = trophyRows.reduce((sum, m) => sum + m.trophies, 0);
  const clubNames = loadedClubs.map((c) => c.name);

  const trophyEntries: ClassementEntry[] = trophyRows.map((m) => ({
    tag: m.tag,
    name: m.name,
    clubName: m.clubName,
    value: m.trophies,
    delta: pushByTag.get(m.tag),
  }));

  const trophiesPanel = (
    <ClassementBoard
      entries={trophyEntries}
      clubNames={clubNames}
      valueLabel="Trophées"
      deltaLabel="Push"
      valueIcon={<TrophyGlyph className="h-4 w-4 shrink-0" />}
      emptyMessage="Aucun membre à classer."
    />
  );

  function rankedPanel(rows: RankedRow[], key: "elo" | "bestElo", note: string) {
    const nameKey = key === "elo" ? "rankName" : "bestRankName";
    const entries: ClassementEntry[] = rows.map((r) => ({
      tag: r.tag,
      name: r.name,
      clubName: r.clubName,
      value: r[key],
      rankLabel: rankLabelFromApi(r[nameKey]),
    }));
    return (
      <div>
        <p className="mb-4 flex items-center gap-2.5 text-xs text-steel-400">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal shadow-[0_0_8px_#45E0D0]" />
          {note}
        </p>
        <ClassementBoard
          entries={entries}
          clubNames={clubNames}
          valueLabel="Elo"
          emptyMessage="Personne n'a encore de rang Ranked (débloqué à 1 000 trophées, puis un premier combat Ranked joué)."
        />
      </div>
    );
  }

  const defaultTab = searchParams?.tab === "ranked-alltime" ? "ranked-alltime" : "trophies";

  return (
    <>
      <Navbar />
      <main className="min-h-screen animate-fadeInUp px-4 pb-20 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-[1160px]">
          <PageBanner
            flush
            kicker={`Purple Corp — Saison ${season.label}`}
            title={
              <>
                Classement
                <br />
                général
              </>
            }
            intro="Tous les membres de tous les clubs, par trophées cumulés ou record Ranked all-time. La progression de la saison en cours (push) est sur sa propre page."
            stats={[
              { value: formatNumber(trophyRows.length), label: "Membres classés" },
              { value: formatNumber(totalTrophies), label: "Trophées cumulés" },
            ]}
          />

          <Tabs
            attached
            defaultTab={defaultTab}
            tabs={[
              { id: "trophies", label: "Trophées", panel: trophiesPanel },
              {
                id: "ranked-alltime",
                label: "Ranked all-time",
                icon: <RankedGlyph className="h-3.5 w-3.5" />,
                panel: rankedPanel(
                  rankedByBest,
                  "bestElo",
                  "Meilleur rang et Elo jamais atteints, toutes saisons confondues."
                ),
              },
            ]}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
