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
import PageBanner from "@/components/PageBanner";

export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

interface TrophyRow extends ClubMember {
  clubName: string;
}

const ROW =
  "grid grid-cols-[48px_minmax(0,1fr)_96px_112px] items-center gap-3.5 px-4 sm:px-6";

function Avatar({ name, rankLabel }: { name: string; rankLabel?: string }) {
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

function ListHeader({ valueLabel, deltaLabel }: { valueLabel: string; deltaLabel: string }) {
  return (
    <div className={`${ROW} border-b border-paper/10 py-3.5 text-[10.5px] uppercase tracking-[0.14em] text-steel-600`}>
      <span>Rang</span>
      <span>Joueur</span>
      <span className="text-right">{deltaLabel}</span>
      <span className="text-right">{valueLabel}</span>
    </div>
  );
}

function Row({
  index,
  tag,
  name,
  sub,
  rankLabel,
  value,
  delta,
  last,
}: {
  index: number;
  tag: string;
  name: string;
  sub: string;
  rankLabel?: string;
  value: number;
  delta?: number;
  last: boolean;
}) {
  return (
    <Link
      href={`/joueurs/${encodeURIComponent(tag.replace(/^#/, ""))}`}
      className={`${ROW} py-3 no-underline transition hover:bg-panel2 ${
        last ? "" : "border-b border-paper/[0.07]"
      }`}
    >
      <span className="rank-index text-xs text-zest2">[{String(index + 1).padStart(2, "0")}]</span>
      <span className="flex min-w-0 items-center gap-3">
        <Avatar name={name} rankLabel={rankLabel} />
        <span className="min-w-0">
          <span className="block truncate text-sm text-paper">{name}</span>
          <span className="block truncate text-xs text-steel-400">{sub}</span>
        </span>
      </span>
      <span className="justify-self-end">
        {delta !== undefined && (
          <span
            className={`stat-mono whitespace-nowrap rounded-md px-2 py-0.5 text-[11.5px] ${
              delta >= 0
                ? "border border-signal/35 bg-signal/10 text-signal"
                : "border border-paper/15 text-blush"
            }`}
          >
            {delta >= 0 ? "+" : "−"}
            {formatNumber(Math.abs(delta))}
          </span>
        )}
      </span>
      <span className="stat-mono whitespace-nowrap text-right text-[15px] text-zest2">
        {formatNumber(value)}
      </span>
    </Link>
  );
}

function RankedList({ rows, valueKey }: { rows: RankedRow[]; valueKey: "elo" | "bestElo" }) {
  const nameKey = valueKey === "elo" ? "rankName" : "bestRankName";
  return (
    <div className="overflow-hidden rounded-2xl border border-paper/10 bg-panel">
      <ListHeader valueLabel="Elo" deltaLabel="" />
      {rows.map((row, i) => {
        const label = rankLabelFromApi(row[nameKey]);
        return (
          <Row
            key={row.tag}
            index={i}
            tag={row.tag}
            name={row.name}
            sub={`${row.clubName} · ${label}`}
            rankLabel={label}
            value={row[valueKey]}
            last={i === rows.length - 1}
          />
        );
      })}
    </div>
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

  const totalTrophies = trophyRows.reduce((sum, m) => sum + m.trophies, 0);

  const trophiesPanel = (
    <>
      <Podium
        entries={trophyRows.slice(0, 3).map((m) => ({
          tag: m.tag,
          name: m.name,
          clubName: m.clubName,
          value: m.trophies,
          delta: pushByTag.get(m.tag),
        }))}
      />
      <div className="overflow-hidden rounded-2xl border border-paper/10 bg-panel">
        <ListHeader valueLabel="Trophées" deltaLabel="Push" />
        {trophyRows.map((member, i) => (
          <Row
            key={member.tag}
            index={i}
            tag={member.tag}
            name={member.name}
            sub={member.clubName}
            value={member.trophies}
            delta={pushByTag.get(member.tag)}
            last={i === trophyRows.length - 1}
          />
        ))}
      </div>
    </>
  );

  const emptyRanked = (
    <p className="rounded-2xl border border-paper/10 bg-panel px-6 py-8 text-sm text-steel-400">
      Personne n&apos;a encore de rang Ranked (débloqué à 1 000 trophées, puis un premier combat
      Ranked joué).
    </p>
  );

  function rankedPanel(rows: RankedRow[], key: "elo" | "bestElo", note: string) {
    if (rows.length === 0) return emptyRanked;
    const nameKey = key === "elo" ? "rankName" : "bestRankName";
    return (
      <div>
        <p className="mb-4 flex items-center gap-2.5 text-xs text-steel-400">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal shadow-[0_0_8px_#45E0D0]" />
          {note}
        </p>
        <Podium
          entries={rows.slice(0, 3).map((r) => ({
            tag: r.tag,
            name: r.name,
            clubName: r.clubName,
            value: r[key],
            rankIconSrc: rankedTierIconPath(rankLabelFromApi(r[nameKey])),
            rankLabel: rankLabelFromApi(r[nameKey]),
          }))}
        />
        <RankedList rows={rows} valueKey={key} />
      </div>
    );
  }

  const defaultTab =
    searchParams?.tab === "ranked"
      ? "ranked"
      : searchParams?.tab === "ranked-alltime"
        ? "ranked-alltime"
        : "trophies";

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
            intro="Tous les membres de tous les clubs, par trophées, Ranked de la saison ou record all-time."
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
                id: "ranked",
                label: "Ranked",
                icon: <RankGlyph className="h-3.5 w-3.5" />,
                panel: rankedPanel(
                  rankedByCurrent,
                  "elo",
                  "Rang et Elo Ranked de la saison en cours, pour chaque membre."
                ),
              },
              {
                id: "ranked-alltime",
                label: "Ranked all-time",
                icon: <RankGlyph className="h-3.5 w-3.5" />,
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
