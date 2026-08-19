import Link from "next/link";
import { getClub, ClubMember } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getRankedRows } from "@/lib/ranked";
import Navbar from "@/components/Navbar";
import Tabs from "@/components/Tabs";
import RankGlyph from "@/components/RankGlyph";
import Podium from "@/components/Podium";

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

export default async function ClassementPage() {
  const tags = clubTags();

  const [clubs, rankedRows] = await Promise.all([
    Promise.all(
      tags.map(async (tag) => {
        try {
          return await getClub(tag);
        } catch {
          return null;
        }
      })
    ),
    getRankedRows(tags).catch(() => []),
  ]);

  const trophyRows: TrophyRow[] = clubs
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .flatMap((club) => club.members.map((m) => ({ ...m, clubName: club.name })))
    .sort((a, b) => b.trophies - a.trophies);

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
      {trophyRows.map((member, i) => (
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
            <span className="stat-mono shrink-0 text-base font-semibold text-zest2">
              {formatNumber(member.trophies)}
            </span>
          </Link>
        </li>
      ))}
    </ol>
    </>
  );

  const rankedPanel = (
    <div>
      <p className="mb-4 text-xs text-ash">
        Basé sur les 25 derniers combats Ranked de chaque joueur (limite de l&apos;API officielle
        — pas de score de saison ou all-time disponible).
      </p>
      {rankedRows.length === 0 ? (
        <p className="rounded-2xl border border-line bg-panel px-4 py-6 text-center text-sm text-ash">
          Personne n&apos;a joué de combat Ranked récemment.
        </p>
      ) : (
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
                    {row.clubName} · {row.wins}V / {row.losses}D sur {row.games} combats
                  </p>
                </div>
                <span
                  className={`stat-mono shrink-0 text-base font-semibold ${
                    row.delta >= 0 ? "text-signal" : "text-blush"
                  }`}
                >
                  {row.delta >= 0 ? "+" : ""}
                  {formatNumber(row.delta)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-4 py-10 sm:px-8 lg:px-16">
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
