import Link from "next/link";
import { getPlayer, getClub, getRankedSummary, sortByTrophies } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline } from "@/lib/kv";
import { getCurrentSeason } from "@/lib/season";
import Navbar from "@/components/Navbar";
import RankGlyph from "@/components/RankGlyph";
import { notFound } from "next/navigation";

// Le rang dans le club / global et le push dépendent de données croisées
// (tous les clubs, Redis) — on calcule à chaque requête plutôt que de figer
// au build.
export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function rankIndex(i: number): string {
  return `[${String(i + 1).padStart(2, "0")}]`;
}

export default async function PlayerPage({ params }: { params: { tag: string } }) {
  let player;
  try {
    player = await getPlayer(params.tag);
  } catch (err) {
    console.error(err);
    notFound();
  }

  const season = getCurrentSeason();
  const allTags = clubTags();

  const [allClubs, baseline, rankedSummary] = await Promise.all([
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
    getRankedSummary(params.tag).catch(() => null),
  ]);

  const loadedClubs = allClubs.filter((c): c is NonNullable<typeof c> => c !== null);
  const homeClub = loadedClubs.find((c) => c.tag === player.club?.tag);

  // Rang du joueur au sein de son propre club.
  let clubRank: number | undefined;
  if (homeClub) {
    const roster = sortByTrophies(homeClub.members);
    const idx = roster.findIndex((m) => m.tag === player.tag);
    if (idx >= 0) clubRank = idx + 1;
  }

  // Rang du joueur toutes familles confondues (classement général).
  const allMembers = loadedClubs.flatMap((c) => c.members).sort((a, b) => b.trophies - a.trophies);
  const globalIdx = allMembers.findIndex((m) => m.tag === player.tag);
  const globalRank = globalIdx >= 0 ? globalIdx + 1 : undefined;

  // Push de la saison, si une photo de départ existe.
  let seasonPush: number | undefined;
  if (baseline) {
    const before = baseline.players.find((p) => p.tag === player.tag);
    if (before) seasonPush = player.trophies - before.trophies;
  }

  const brawlers = [...player.brawlers].sort((a, b) => b.trophies - a.trophies);
  const totalVictories =
    player.soloVictories + player.duoVictories + player["3vs3Victories"];

  return (
    <>
      <Navbar />
      <main className="min-h-screen animate-fadeInUp px-4 py-10 sm:px-8 lg:px-16">
        <section className="hud-frame mx-auto max-w-3xl bg-panel px-6 py-8 text-center sm:px-10 sm:py-10">
          {player.club && (
            <Link
              href={`/clubs/${encodeURIComponent(player.club.tag.replace(/^#/, ""))}`}
              className="font-display text-xs uppercase tracking-[0.3em] text-signal hover:underline"
            >
              {player.club.name}
            </Link>
          )}
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {player.name}
          </h1>
          <p className="mt-1 font-mono text-xs text-ash">Niveau d&apos;XP {player.expLevel}</p>

          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-line pt-8 sm:grid-cols-4">
            <div>
              <p className="stat-mono text-2xl font-semibold text-zest">
                {formatNumber(player.trophies)}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-ash">Trophées</p>
            </div>
            <div>
              <p className="stat-mono text-2xl font-semibold text-zest2">
                {formatNumber(player.highestTrophies)}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-ash">Record perso</p>
            </div>
            <div>
              <p className="stat-mono text-2xl font-semibold text-signal">
                {formatNumber(totalVictories)}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-ash">Victoires totales</p>
            </div>
            <div>
              <p className="stat-mono text-2xl font-semibold text-white">{brawlers.length}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-ash">Brawlers</p>
            </div>
          </div>

          {/* Contexte compétitif : où il se situe dans son club, dans
              Purple Corp, et sa progression cette saison. */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-6">
            <div>
              <p className="stat-mono text-lg font-semibold text-white">
                {clubRank ? `#${clubRank}` : "—"}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ash">Dans son club</p>
            </div>
            <div>
              <p className="stat-mono text-lg font-semibold text-white">
                {globalRank ? `#${globalRank}` : "—"}
                {allMembers.length ? <span className="text-ash"> / {allMembers.length}</span> : null}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ash">
                Classement Purple Corp
              </p>
            </div>
            <div>
              <p
                className={`stat-mono text-lg font-semibold ${
                  seasonPush !== undefined
                    ? seasonPush >= 0
                      ? "text-signal"
                      : "text-blush"
                    : "text-white"
                }`}
              >
                {seasonPush !== undefined
                  ? `${seasonPush >= 0 ? "+" : ""}${formatNumber(seasonPush)}`
                  : "—"}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ash">
                Push {season.label}
              </p>
            </div>
          </div>
        </section>

        {/* Activité Ranked récente — 25 derniers combats, limite de l'API. */}
        {rankedSummary && rankedSummary.games > 0 && (
          <section className="mx-auto mt-6 max-w-3xl rounded-2xl border border-line bg-panel px-6 py-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.2em] text-ash">
                <RankGlyph className="h-3.5 w-3.5" /> Ranked — 25 derniers combats
              </h2>
              <span
                className={`stat-mono text-lg font-semibold ${
                  rankedSummary.delta >= 0 ? "text-signal" : "text-blush"
                }`}
              >
                {rankedSummary.delta >= 0 ? "+" : ""}
                {formatNumber(rankedSummary.delta)}
              </span>
            </div>
            <p className="mt-1 text-xs text-ash">
              {rankedSummary.wins} victoires · {rankedSummary.losses} défaites sur{" "}
              {rankedSummary.games} combats Ranked
            </p>
          </section>
        )}

        <section className="mx-auto mt-8 max-w-3xl">
          <h2 className="mb-4 font-display text-xs uppercase tracking-[0.2em] text-ash">
            Ses meilleurs brawlers
          </h2>
          <ol className="divide-y divide-line rounded-2xl border border-line bg-panel">
            {brawlers.slice(0, 15).map((b, i) => (
              <li key={b.id} className="flex items-center gap-4 px-4 py-3">
                <span className="rank-index w-9 shrink-0 text-xs text-zest">
                  {rankIndex(i)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-medium text-white">
                    {b.name}
                  </p>
                  <p className="text-xs text-ash">Puissance {b.power}</p>
                </div>
                <span className="stat-mono shrink-0 text-base font-semibold text-zest2">
                  {formatNumber(b.trophies)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}
