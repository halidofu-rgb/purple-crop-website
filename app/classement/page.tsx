import Link from "next/link";
import { getClub, ClubMember } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline } from "@/lib/kv";
import { listAllRankedTracking } from "@/lib/rankedTracking";
import { rankedTierLabel } from "@/lib/rankedTier";
import { getCurrentSeason } from "@/lib/season";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Tabs from "@/components/Tabs";
import RankGlyph from "@/components/RankGlyph";
import Podium from "@/components/Podium";
import Badge from "@/components/Badge";

export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function rankIndex(i: number): string {
  return `[${String(i + 1).padStart(2, "0")}]`;
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

  const [clubs, rankedTracking, baseline] = await Promise.all([
    Promise.all(
      tags.map(async (tag) => {
        try {
          return await getClub(tag);
        } catch {
          return null;
        }
      })
    ),
    listAllRankedTracking().catch(() => []),
    getSeasonBaseline(season.key).catch(() => null),
  ]);

  const trophyRows: TrophyRow[] = clubs
    .filter((c): c is NonNullable<typeof c> => c !== null)
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

  const trophiesPanel = (
    <>
      <Podium
        entries={trophyRows.slice(0, 3).map((m) => ({
          tag: m.tag,
          name: m.name,
          clubName: m.clubName,
          value: m.trophies,
        }))}
      />
      <ol className="divide-y divide-paper/10 rounded-2xl border border-paper/10 bg-panel">
      {trophyRows.map((member, i) => {
        const push = pushByTag.get(member.tag);
        return (
        <li key={member.tag}>
          <Link
            href={`/joueurs/${encodeURIComponent(member.tag.replace(/^#/, ""))}`}
            className="flex items-center gap-4 px-4 py-3 transition hover:bg-panel2"
          >
            <span className="rank-index w-10 shrink-0 text-xs text-zest">{rankIndex(i)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-paper">
                {member.name}
              </p>
              <p className="text-xs text-steel-400">{member.clubName}</p>
            </div>
            {push !== undefined && (
              <Badge tone={push >= 0 ? "success" : "danger"}>
                {push >= 0 ? "+" : ""}
                {formatNumber(push)}
              </Badge>
            )}
            <span className="stat-mono shrink-0 text-base font-semibold text-zest2">
              {formatNumber(member.trophies)}
            </span>
          </Link>
        </li>
        );
      })}
    </ol>
    </>
  );

  const rankedRows = rankedTracking
    .filter((r) => r.current > 0 || r.allTimeBest > 0)
    .sort((a, b) => b.current - a.current);

  const rankedPanel = (
    <div>
      <div className="mb-4 flex items-start gap-2">
        <Badge tone="warning">suivi automatique</Badge>
        <p className="text-xs text-steel-400">
          Calculé en synchronisant régulièrement le journal de combats Ranked de chaque membre —
          l&apos;API Brawl Stars ne fournit aucun score Ranked directement.
        </p>
      </div>
      {rankedRows.length === 0 ? (
        <p className="rounded-2xl border border-paper/10 bg-panel px-4 py-6 text-center text-sm text-steel-400">
          Aucune donnée pour l&apos;instant — la première synchronisation n&apos;a pas encore eu
          lieu, ou personne n&apos;a encore joué de combat Ranked depuis.
        </p>
      ) : (
        <>
          <Podium
            entries={rankedRows.slice(0, 3).map((r) => ({
              tag: r.tag,
              name: r.name,
              clubName: r.clubName,
              value: r.current,
            }))}
          />
          <ol className="divide-y divide-paper/10 rounded-2xl border border-paper/10 bg-panel">
            {rankedRows.map((row, i) => (
              <li key={row.tag}>
                <Link
                  href={`/joueurs/${encodeURIComponent(row.tag.replace(/^#/, ""))}`}
                  className="flex items-center gap-4 px-4 py-3 transition hover:bg-panel2"
                >
                  <span className="rank-index w-10 shrink-0 text-xs text-signal">
                    {rankIndex(i)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-paper">
                      {row.name}
                    </p>
                    <p className="text-xs text-steel-400">
                      {row.clubName} · {rankedTierLabel(row.current)}
                    </p>
                  </div>
                  <Badge tone="neutral">all-time {formatNumber(row.allTimeBest)}</Badge>
                  <span className="stat-mono shrink-0 text-base font-semibold text-signal">
                    {formatNumber(row.current)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen animate-fadeInUp px-4 py-10 sm:px-8 lg:px-16">
        <section className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-signal">
            Purple Corp
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-paper sm:text-5xl">
            Classement général
          </h1>
          <p className="mt-3 text-sm text-steel-400">
            Tous les membres de tous les clubs, triés par trophées ou par activité Ranked.
          </p>
        </section>

        <section className="mx-auto mt-10 max-w-3xl">
          <Tabs
            defaultTab={searchParams?.tab === "ranked" ? "ranked" : "trophies"}
            tabs={[
              { id: "trophies", label: "Trophées", panel: trophiesPanel },
              {
                id: "ranked",
                label: "Ranked",
                icon: <RankGlyph className="h-3.5 w-3.5" />,
                panel: rankedPanel,
              },
            ]}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
