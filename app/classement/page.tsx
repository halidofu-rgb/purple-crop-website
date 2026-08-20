import Link from "next/link";
import { getClub, ClubMember } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { listAllMemberLinks } from "@/lib/members";
import { getSeasonBaseline } from "@/lib/kv";
import { rankedTierLabel } from "@/lib/rankedTier";
import { getCurrentSeason } from "@/lib/season";
import Navbar from "@/components/Navbar";
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

  const [clubs, memberLinks, baseline] = await Promise.all([
    Promise.all(
      tags.map(async (tag) => {
        try {
          return await getClub(tag);
        } catch {
          return null;
        }
      })
    ),
    listAllMemberLinks().catch(() => []),
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
      <ol className="divide-y divide-line rounded-2xl border border-line bg-panel">
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
              <p className="truncate font-display text-sm font-medium text-white">
                {member.name}
              </p>
              <p className="text-xs text-ash">{member.clubName}</p>
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

  // Nom du club + pseudo en jeu affichés pour un membre lié, retrouvés via
  // le classement trophées déjà calculé — pas besoin d'un second appel.
  const clubNameByTag = new Map(trophyRows.map((m) => [m.tag.toUpperCase(), m.clubName]));
  const nameByTag = new Map(trophyRows.map((m) => [m.tag.toUpperCase(), m.name]));

  const rankedRows = memberLinks
    .filter((m) => m.rankedScore !== undefined)
    .map((m) => ({
      tag: m.tag,
      name: nameByTag.get(m.tag.toUpperCase()) ?? m.discordName,
      clubName: clubNameByTag.get(m.tag.toUpperCase()) ?? "",
      rankedScore: m.rankedScore!,
      rankedBest: m.rankedBest,
    }))
    .sort((a, b) => b.rankedScore - a.rankedScore);

  const rankedPanel = (
    <div>
      <div className="mb-4 flex items-start gap-2">
        <Badge tone="warning">auto-déclaré</Badge>
        <p className="text-xs text-ash">
          Score indiqué par chaque membre depuis son compte lié (/compte) — l&apos;API Brawl
          Stars ne fournit aucun score Ranked, impossible de le récupérer automatiquement.
        </p>
      </div>
      {rankedRows.length === 0 ? (
        <p className="rounded-2xl border border-line bg-panel px-4 py-6 text-center text-sm text-ash">
          Personne n&apos;a encore lié son compte et indiqué son Ranked.{" "}
          <Link href="/compte" className="text-signal hover:underline">
            Sois le premier →
          </Link>
        </p>
      ) : (
        <>
          <Podium
            entries={rankedRows.slice(0, 3).map((r) => ({
              tag: r.tag,
              name: r.name,
              clubName: r.clubName,
              value: r.rankedScore,
            }))}
          />
          <ol className="divide-y divide-line rounded-2xl border border-line bg-panel">
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
                    <p className="truncate font-display text-sm font-medium text-white">
                      {row.name}
                    </p>
                    <p className="text-xs text-ash">
                      {row.clubName} · {rankedTierLabel(row.rankedScore)}
                    </p>
                  </div>
                  {row.rankedBest !== undefined && (
                    <Badge tone="neutral">all-time {formatNumber(row.rankedBest)}</Badge>
                  )}
                  <span className="stat-mono shrink-0 text-base font-semibold text-signal">
                    {formatNumber(row.rankedScore)}
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
          <p className="font-display text-xs uppercase tracking-[0.3em] text-signal">
            Purple Corp
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Classement général
          </h1>
          <p className="mt-3 text-sm text-ash">
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
    </>
  );
}
