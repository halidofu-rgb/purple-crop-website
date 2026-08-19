import Image from "next/image";
import Link from "next/link";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline } from "@/lib/kv";
import { getRankedRows } from "@/lib/ranked";
import { getCurrentSeason, formatCountdown } from "@/lib/season";
import Navbar from "@/components/Navbar";
import RankGlyph from "@/components/RankGlyph";
import Button from "@/components/Button";

// La partie "meilleur pusher" dépend de Redis, pas du cache fetch() —
// on garde la page toujours calculée à la demande.
export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function rankIndex(i: number): string {
  return `[${String(i + 1).padStart(2, "0")}]`;
}

export default async function HomePage() {
  const tags = clubTags();
  const season = getCurrentSeason();

  const [clubResults, baseline, rankedRows] = await Promise.all([
    Promise.all(
      tags.map(async (tag) => {
        try {
          const club = await getClub(tag);
          return { tag, club, error: null as string | null };
        } catch (err) {
          return { tag, club: null, error: (err as Error).message };
        }
      })
    ),
    getSeasonBaseline(season.key).catch(() => null),
    getRankedRows(tags).catch(() => []),
  ]);

  const loadedClubs = clubResults.filter((r) => r.club).map((r) => r.club!);
  const totalTrophies = loadedClubs.reduce((sum, c) => sum + c.trophies, 0);
  const totalMembers = loadedClubs.reduce((sum, c) => sum + c.members.length, 0);
  const topClub = [...loadedClubs].sort((a, b) => b.trophies - a.trophies)[0];

  let pushRows: { tag: string; name: string; clubName: string; delta: number }[] = [];
  if (baseline) {
    const baselineByTag = new Map(baseline.players.map((p) => [p.tag, p]));
    pushRows = loadedClubs
      .flatMap((club) =>
        club.members.map((m) => {
          const before = baselineByTag.get(m.tag);
          const delta = before ? m.trophies - before.trophies : 0;
          return { tag: m.tag, name: m.name, clubName: club.name, delta };
        })
      )
      .sort((a, b) => b.delta - a.delta);
  }
  const king = pushRows[0];
  const rankedKing = rankedRows[0];

  return (
    <>
      <Navbar />
      <main className="min-h-screen animate-fadeInUp px-4 py-10 sm:px-8 lg:px-16">
        {/* HERO : présentation + accès direct aux deux vues principales,
            plus un aperçu chiffré de la famille pour donner envie de creuser. */}
        <section className="hud-frame mx-auto max-w-5xl bg-panel px-6 py-8 sm:px-10 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10" />
                <p className="font-display text-[11px] uppercase tracking-[0.3em] text-signal">
                  Bienvenue sur
                </p>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                Purple Corp
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-ash">
                Le suivi en direct de nos clubs Brawl Stars : trophées, classement général et qui
                pousse le plus fort cette saison.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button href="/clubs" variant="primary">
                  Voir les clubs
                </Button>
                <Button href="/classement" variant="secondary">
                  Classement général
                </Button>
              </div>
            </div>

            {/* Aperçu de la famille : trois faits marquants, cliquables. */}
            <div className="flex flex-col gap-3 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="font-display text-[11px] uppercase tracking-[0.25em] text-ash">
                Aperçu de la famille
              </p>
              {topClub && (
                <Link
                  href={`/clubs/${encodeURIComponent(topClub.tag.replace(/^#/, ""))}`}
                  className="flex items-center justify-between rounded-xl border border-line px-4 py-3 transition hover:border-zest"
                >
                  <div>
                    <p className="font-display text-sm font-medium text-white">{topClub.name}</p>
                    <p className="text-[11px] text-ash">Club le mieux classé</p>
                  </div>
                  <span className="stat-mono text-sm font-semibold text-zest">
                    {formatNumber(topClub.trophies)}
                  </span>
                </Link>
              )}
              {king && (
                <Link
                  href="/pusheurs"
                  className="flex items-center justify-between rounded-xl border border-line px-4 py-3 transition hover:border-signal"
                >
                  <div>
                    <p className="font-display text-sm font-medium text-white">{king.name}</p>
                    <p className="text-[11px] text-ash">👑 Roi du push</p>
                  </div>
                  <span className="stat-mono text-sm font-semibold text-signal">
                    +{formatNumber(king.delta)}
                  </span>
                </Link>
              )}
              {rankedKing && (
                <Link
                  href="/classement"
                  className="flex items-center justify-between rounded-xl border border-line px-4 py-3 transition hover:border-signal"
                >
                  <div>
                    <p className="font-display text-sm font-medium text-white">{rankedKing.name}</p>
                    <p className="flex items-center gap-1 text-[11px] text-ash">
                      <RankGlyph className="h-3 w-3" /> Meilleur en Ranked
                    </p>
                  </div>
                  <span className="stat-mono text-sm font-semibold text-signal">
                    +{formatNumber(rankedKing.delta)}
                  </span>
                </Link>
              )}
              <Link
                href="/pusheurs"
                className="flex items-center justify-between rounded-xl border border-line px-4 py-3 transition hover:border-zest2"
              >
                <div>
                  <p className="font-display text-sm font-medium text-white">{season.label}</p>
                  <p className="text-[11px] text-ash">Saison en cours</p>
                </div>
                <span className="font-mono text-xs text-ash">
                  ⏳ {formatCountdown(season.end)}
                </span>
              </Link>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-6 sm:grid-cols-4">
            <div>
              <p className="stat-mono text-2xl font-semibold text-zest">
                {formatNumber(totalTrophies)}
              </p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ash">
                Trophées totaux
              </p>
            </div>
            <div>
              <p className="stat-mono text-2xl font-semibold text-white">{totalMembers}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ash">Joueurs actifs</p>
            </div>
            <div>
              <p className="stat-mono text-2xl font-semibold text-white">{loadedClubs.length}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ash">Clubs</p>
            </div>
            <div>
              <p className="font-display text-2xl font-semibold text-white">{season.label}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ash">Saison</p>
            </div>
          </div>
        </section>

        {/* Deux aperçus rapides côte à côte, chacun avec un accès direct
            à sa page complète. */}
        <section className="mx-auto mt-8 grid max-w-5xl gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-line bg-panel">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="font-display text-xs uppercase tracking-[0.2em] text-ash">
                Nos clubs
              </h2>
              <Link
                href="/clubs"
                className="font-mono text-[10px] uppercase tracking-widest text-ash transition hover:text-zest"
              >
                voir tout →
              </Link>
            </div>
            <ol className="divide-y divide-line">
              {clubResults.map(({ tag, club, error }, i) => (
                <li key={tag}>
                  {club ? (
                    <Link
                      href={`/clubs/${encodeURIComponent(tag.replace(/^#/, ""))}`}
                      className="flex items-center gap-3 px-5 py-3 transition hover:bg-panel2"
                    >
                      <span className="rank-index w-9 shrink-0 text-xs text-zest">
                        {rankIndex(i)}
                      </span>
                      <span className="flex-1 truncate font-display text-sm font-medium text-white">
                        {club.name}
                      </span>
                      <span className="stat-mono shrink-0 text-sm font-semibold text-zest2">
                        {formatNumber(club.trophies)}
                      </span>
                    </Link>
                  ) : (
                    <p className="px-5 py-3 text-xs text-blush">Erreur pour {tag} — {error}</p>
                  )}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-line bg-panel">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="font-display text-xs uppercase tracking-[0.2em] text-ash">
                Meilleurs pushers · {season.label}
              </h2>
              <Link
                href="/pusheurs"
                className="font-mono text-[10px] uppercase tracking-widest text-ash transition hover:text-signal"
              >
                voir tout →
              </Link>
            </div>
            {pushRows.length > 0 ? (
              <ol className="divide-y divide-line">
                {pushRows.slice(0, 5).map((row, i) => (
                  <li key={row.tag}>
                    <Link
                      href={`/joueurs/${encodeURIComponent(row.tag.replace(/^#/, ""))}`}
                      className="flex items-center gap-3 px-5 py-3 transition hover:bg-panel2"
                    >
                      <span className="rank-index w-9 shrink-0 text-xs text-zest">
                        {rankIndex(i)}
                      </span>
                      <span className="flex-1 truncate font-display text-sm font-medium text-white">
                        {row.name}
                      </span>
                      <span
                        className={`stat-mono shrink-0 text-sm font-semibold ${
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
            ) : (
              <p className="px-5 py-4 text-xs text-ash">
                Pas encore de photo de départ pour cette saison — reviens un peu plus tard.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-panel">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.2em] text-ash">
                <RankGlyph className="h-3.5 w-3.5" /> Meilleurs en Ranked
              </h2>
              <Link
                href="/classement"
                className="font-mono text-[10px] uppercase tracking-widest text-ash transition hover:text-signal"
              >
                voir tout →
              </Link>
            </div>
            {rankedRows.length > 0 ? (
              <ol className="divide-y divide-line">
                {rankedRows.slice(0, 5).map((row, i) => (
                  <li key={row.tag}>
                    <Link
                      href={`/joueurs/${encodeURIComponent(row.tag.replace(/^#/, ""))}`}
                      className="flex items-center gap-3 px-5 py-3 transition hover:bg-panel2"
                    >
                      <span className="rank-index w-9 shrink-0 text-xs text-signal">
                        {rankIndex(i)}
                      </span>
                      <span className="flex-1 truncate font-display text-sm font-medium text-white">
                        {row.name}
                      </span>
                      <span
                        className={`stat-mono shrink-0 text-sm font-semibold ${
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
            ) : (
              <p className="px-5 py-4 text-xs text-ash">
                Personne n&apos;a joué de combat Ranked récemment.
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
