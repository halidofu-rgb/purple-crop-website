import Link from "next/link";
import { getClub, ClubMember } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline } from "@/lib/kv";
import { getRankedRowsForClubs, RankedRow } from "@/lib/rankedLive";
import { rankLabelFromApi, rankedTierIconPath } from "@/lib/rankedTier";
import { getCurrentSeason } from "@/lib/season";
import { avatarColor } from "@/lib/avatarColor";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Tabs from "@/components/Tabs";
import RankGlyph from "@/components/RankGlyph";
import RankTierIcon from "@/components/RankTierIcon";
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

// Avatar généré (pas de vraie photo côté Brawl Stars), avec un badge de
// rang superposé quand on est dans un contexte Ranked — même principe que
// Podium.tsx, pour que classement et podium se répondent visuellement.
function Avatar({
  name,
  rankLabel,
}: {
  name: string;
  rankLabel?: string;
}) {
  return (
    <span
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-ink"
      style={{ backgroundColor: avatarColor(name) }}
    >
      {name.trim().charAt(0).toUpperCase()}
      {rankLabel && (
        <RankTierIcon
          src={rankedTierIconPath(rankLabel)}
          label={rankLabel}
          className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border border-panel bg-panel2 p-0.5"
        />
      )}
    </span>
  );
}

function RankedList({ rows, valueKey }: { rows: RankedRow[]; valueKey: "elo" | "bestElo" }) {
  const nameKey = valueKey === "elo" ? "rankName" : "bestRankName";
  return (
    <ol className="divide-y divide-paper/10 rounded-2xl border border-paper/10 bg-panel">
      {rows.map((row, i) => {
        const label = rankLabelFromApi(row[nameKey]);
        return (
          <li key={row.tag}>
            <Link
              href={`/joueurs/${encodeURIComponent(row.tag.replace(/^#/, ""))}`}
              className="flex items-center gap-3.5 px-4 py-3 transition hover:bg-panel2"
            >
              <span className="rank-index w-8 shrink-0 text-xs text-signal">{rankIndex(i)}</span>
              <Avatar name={row.name} rankLabel={label} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-paper">{row.name}</p>
                <p className="truncate text-xs text-steel-400">
                  {row.clubName} · {label}
                </p>
              </div>
              <span className="stat-mono shrink-0 text-base font-semibold text-signal">
                {formatNumber(row[valueKey])}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
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
                className="flex items-center gap-3.5 px-4 py-3 transition hover:bg-panel2"
              >
                <span className="rank-index w-8 shrink-0 text-xs text-zest">{rankIndex(i)}</span>
                <Avatar name={member.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-paper">{member.name}</p>
                  <p className="truncate text-xs text-steel-400">{member.clubName}</p>
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

  const emptyRanked = (
    <p className="rounded-2xl border border-paper/10 bg-panel px-4 py-6 text-center text-sm text-steel-400">
      Personne n&apos;a encore de rang Ranked (débloqué à 1 000 trophées, puis un premier combat
      Ranked joué).
    </p>
  );

  const rankedPanel = (
    <div>
      <div className="mb-4 flex items-start gap-2">
        <Badge tone="success">à jour</Badge>
        <p className="text-xs text-steel-400">
          Rang et Elo Ranked de la saison en cours, pour chaque membre.
        </p>
      </div>
      {rankedByCurrent.length === 0 ? (
        emptyRanked
      ) : (
        <>
          <Podium
            entries={rankedByCurrent.slice(0, 3).map((r) => ({
              tag: r.tag,
              name: r.name,
              clubName: r.clubName,
              value: r.elo,
              rankIconSrc: rankedTierIconPath(rankLabelFromApi(r.rankName)),
              rankLabel: rankLabelFromApi(r.rankName),
            }))}
          />
          <RankedList rows={rankedByCurrent} valueKey="elo" />
        </>
      )}
    </div>
  );

  const rankedAllTimePanel = (
    <div>
      <div className="mb-4 flex items-start gap-2">
        <Badge tone="success">à jour</Badge>
        <p className="text-xs text-steel-400">
          Meilleur rang et Elo jamais atteints par chaque membre, toutes saisons confondues.
        </p>
      </div>
      {rankedByBest.length === 0 ? (
        emptyRanked
      ) : (
        <>
          <Podium
            entries={rankedByBest.slice(0, 3).map((r) => ({
              tag: r.tag,
              name: r.name,
              clubName: r.clubName,
              value: r.bestElo,
              rankIconSrc: rankedTierIconPath(rankLabelFromApi(r.bestRankName)),
              rankLabel: rankLabelFromApi(r.bestRankName),
            }))}
          />
          <RankedList rows={rankedByBest} valueKey="bestElo" />
        </>
      )}
    </div>
  );

  const defaultTab =
    searchParams?.tab === "ranked"
      ? "ranked"
      : searchParams?.tab === "ranked-alltime"
        ? "ranked-alltime"
        : "trophies";

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
            Tous les membres de tous les clubs, par trophées, Ranked ou record all-time.
          </p>
        </section>

        <section className="mx-auto mt-10 max-w-3xl">
          <Tabs
            defaultTab={defaultTab}
            tabs={[
              { id: "trophies", label: "Trophées", panel: trophiesPanel },
              {
                id: "ranked",
                label: "Ranked",
                icon: <RankGlyph className="h-3.5 w-3.5" />,
                panel: rankedPanel,
              },
              {
                id: "ranked-alltime",
                label: "Ranked all-time",
                icon: <RankGlyph className="h-3.5 w-3.5" />,
                panel: rankedAllTimePanel,
              },
            ]}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
