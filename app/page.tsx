import Image from "next/image";
import Link from "next/link";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline } from "@/lib/kv";
import { listAllRankedTracking } from "@/lib/rankedTracking";
import { getCurrentSeason, formatCountdown } from "@/lib/season";
import { PURPLE_CORP_DISCORD_URL } from "@/lib/site";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import { MessageCircle } from "lucide-react";
import { TrophyGlyph, SwordsGlyph } from "@/components/icons";

// La partie "meilleur pusher" dépend de Redis, pas du cache fetch() —
// on garde la page toujours calculée à la demande.
export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

export default async function HomePage() {
  const tags = clubTags();
  const season = getCurrentSeason();

  const [clubResults, baseline, rankedTracking] = await Promise.all([
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
    listAllRankedTracking().catch(() => []),
  ]);

  const loadedClubs = clubResults.filter((r) => r.club).map((r) => r.club!);
  const totalTrophies = loadedClubs.reduce((sum, c) => sum + c.trophies, 0);
  const totalMembers = loadedClubs.reduce((sum, c) => sum + c.members.length, 0);

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
  const rankedBest = [...rankedTracking]
    .filter((r) => r.current > 0)
    .sort((a, b) => b.current - a.current)[0];

  return (
    <>
      <Navbar />
      <main className="animate-fadeInUp">
        {/* HERO — repris de la direction artistique Claude Design, données réelles */}
        <section className="relative overflow-hidden border-b border-paper/10 px-4 sm:px-8 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_12%_0%,#262a60_0%,transparent_58%),radial-gradient(70%_70%_at_88%_30%,rgba(145,132,217,0.22)_0%,transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-50 bg-[linear-gradient(rgba(233,233,237,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(233,233,237,0.055)_1px,transparent_1px)] bg-[size:96px_96px] [mask-image:radial-gradient(90%_80%_at_20%_20%,#000,transparent)]" />
          <div className="pointer-events-none absolute inset-y-0 left-[58%] w-px -skew-x-12 bg-gradient-to-b from-transparent via-zest2/50 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 left-[63%] w-px -skew-x-12 bg-gradient-to-b from-transparent via-zest2/20 to-transparent" />

          <div className="relative mx-auto grid min-h-[560px] max-w-[1344px] items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-20">
            <div>
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-zest2/35 bg-iris/35 py-1.5 pr-3 pl-2 text-[11.5px] tracking-[0.14em] uppercase text-zest2">
                <span className="rounded-full bg-zest2 px-1.5 py-0.5 tracking-[0.1em] text-ink">
                  {season.label}
                </span>
                Saison en cours
              </div>

              <h1 className="font-display text-5xl leading-[0.95] font-medium tracking-[-0.03em] uppercase text-paper lg:text-[84px]">
                Deux lignes.
                <br />
                <span className="text-zest2 [text-shadow:0_0_60px_rgba(181,171,252,0.45)]">
                  Un seul standard.
                </span>
              </h1>

              <p className="mt-5 mb-8 max-w-[520px] text-[17px] leading-relaxed text-steel-400">
                Purple Corp réunit <strong className="font-medium text-paper">Purple Line</strong>{" "}
                et <strong className="font-medium text-paper">Indigo Line</strong> : deux clubs,
                une même exigence compétitive. Trophées, rangs Ranked et push de saison, suivis en
                direct.
              </p>

              <div className="mb-10 flex flex-wrap gap-3">
                <Link
                  href="/classement"
                  className="rounded-lg border border-zest bg-zest/10 px-6 py-3.5 text-[13px] tracking-[0.12em] uppercase text-zest2 transition-colors hover:bg-zest/25 active:bg-zest/35"
                >
                  Voir le classement
                </Link>
                <Link
                  href={PURPLE_CORP_DISCORD_URL}
                  className="rounded-lg border border-paper/20 px-6 py-3.5 text-[13px] tracking-[0.12em] uppercase text-steel-400 transition-colors hover:border-paper/40 hover:text-paper"
                >
                  Postuler à un club
                </Link>
              </div>

              <dl className="grid grid-cols-2 border-t border-paper/10 pt-5 sm:grid-cols-4">
                {[
                  { value: formatNumber(totalTrophies), label: "Trophées cumulés" },
                  { value: String(totalMembers), label: "Joueurs actifs" },
                  { value: String(loadedClubs.length), label: "Clubs" },
                  {
                    value: rankedBest ? formatNumber(rankedBest.current) : "—",
                    label: "Meilleur Elo Ranked",
                  },
                ].map((s, i) => (
                  <div key={s.label} className={i === 0 ? "pr-5" : "border-l border-paper/10 px-5"}>
                    <dd className="stat-mono text-[34px] leading-none tracking-[-0.02em] text-paper">
                      {s.value}
                    </dd>
                    <dt className="mt-1.5 text-[11px] tracking-[0.14em] uppercase text-steel-600">
                      {s.label}
                    </dt>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex flex-col gap-3.5">
              {[...loadedClubs].sort((a, b) => b.trophies - a.trophies).map((club, i) => (
                <Link
                  key={club.tag}
                  href={`/clubs/${encodeURIComponent(club.tag.replace(/^#/, ""))}`}
                  className={
                    i === 0
                      ? "relative overflow-hidden rounded-2xl border border-zest2/35 bg-gradient-to-br from-iris/55 to-panel/60 px-6 py-6"
                      : "relative overflow-hidden rounded-2xl border border-paper/15 bg-gradient-to-br from-panel/85 to-ink/60 px-6 py-6"
                  }
                >
                  {i === 0 && (
                    <div className="pointer-events-none absolute inset-0 animate-sweep bg-[linear-gradient(100deg,transparent_40%,rgba(181,171,252,0.18)_50%,transparent_60%)]" />
                  )}
                  <div className="relative flex items-center gap-4">
                    <Image
                      src="/logo.png"
                      alt=""
                      width={48}
                      height={48}
                      className="h-12 w-12 shrink-0 rounded-xl"
                    />
                    <div className="flex-1">
                      <p className={`text-[11px] tracking-[0.16em] uppercase ${i === 0 ? "text-zest2" : "text-steel-500"}`}>
                        {i === 0 ? "Club principal" : "Club académie"}
                      </p>
                      <h2 className="mt-0.5 text-2xl tracking-[-0.02em] text-paper">{club.name}</h2>
                    </div>
                    <div className="text-right">
                      <p className="stat-mono text-xl tracking-[-0.01em] text-paper">
                        {formatNumber(club.trophies)}
                      </p>
                      <p className="text-[10.5px] tracking-[0.12em] uppercase text-steel-500">
                        trophées
                      </p>
                    </div>
                  </div>
                  <div className="relative mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-paper/10 pt-4 text-xs text-steel-400">
                    <span>{club.members.length}/30 membres</span>
                    <span className="text-steel-800">/</span>
                    <span>{formatNumber(club.requiredTrophies)}+ requis</span>
                  </div>
                </Link>
              ))}

              <div className="flex items-center justify-between rounded-2xl border border-paper/10 bg-panel/40 px-5 py-4">
                <p className="text-xs tracking-[0.12em] uppercase text-steel-600">
                  Fin de la saison
                </p>
                <p className="stat-mono text-lg text-zest2">⏳ {formatCountdown(season.end)}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="px-4 py-6 sm:px-8 lg:px-16">

        {/* DISCORD — bloc premium avec dégradé */}
        <section className="relative mx-auto mt-12 max-w-4xl overflow-hidden rounded-3xl border border-paper/10 bg-gradient-to-br from-panel via-panel to-[#241335] px-6 py-8 text-center sm:px-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-zest/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-signal/10 blur-3xl" />
          <div className="relative">
            <p className="font-display text-lg font-semibold text-paper sm:text-xl">
              Rejoins-nous sur le Discord Purple Corp
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-steel-400">
              Discussions, recrutement, annonces des deux clubs — tout se passe là-bas.
            </p>
            <div className="mt-5">
              <Button
                href={PURPLE_CORP_DISCORD_URL}
                variant="primary"
                size="lg"
                icon={<MessageCircle className="h-4 w-4" />}
              >
                Rejoindre le Discord
              </Button>
            </div>
          </div>
        </section>

        {/* NOTRE HISTOIRE */}
        <section className="mx-auto mt-10 max-w-3xl rounded-3xl border border-paper/10 bg-panel px-6 py-8 sm:px-10">
          <p className="font-display text-xs uppercase tracking-[0.25em] text-signal">
            Purple Corp – Plus qu&apos;un club, une famille
          </p>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-steel-400">
            <p>
              Bienvenue chez Purple Corp, le club Brawl Stars qui ne fait pas semblant. Fondé sur
              une ambition simple : rassembler les joueurs les plus motivés autour d&apos;une
              progression sérieuse et d&apos;un vrai esprit d&apos;équipe.
            </p>
            <p>
              Sous la présidence de <span className="text-paper">Rapso</span>, notre club s&apos;est
              hissé parmi l&apos;élite française et mondiale : Top 14 monde et Top 9 France au
              record, aujourd&apos;hui stable en Top 70 France / Top 530 monde. Une performance qui
              reflète l&apos;exigence et la mentalité tryhard de notre ligne compétitive, la{" "}
              <span className="text-paper">Purple Line</span> (125K+ trophées minimum).
            </p>
            <p>
              À côté de ça, notre <span className="text-paper">Indigo Line</span> (100K+ trophées
              minimum) accueille les joueurs compétitifs qui veulent progresser dans une ambiance
              bienveillante, avec entraide, suivi et un Discord actif — actuellement Top 93 France.
            </p>
            <p>
              Ici, pas de place pour l&apos;individualisme : événements réguliers, communauté
              active, et un seul objectif — marquer les esprits.
            </p>
            <p className="font-display font-semibold text-paper">Rejoins-nous.</p>
          </div>
        </section>

        {/* NOS CLUBS — vrai aperçu, pas juste un lien */}
        <section className="mx-auto mt-10 max-w-4xl">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xs uppercase tracking-[0.2em] text-steel-400">Nos clubs</h2>
            <Link href="/clubs" className="text-xs text-signal hover:underline">
              Voir la famille →
            </Link>
          </div>
          <ol className="mt-3 divide-y divide-paper/10 rounded-2xl border border-paper/10 bg-panel">
            {[...loadedClubs].sort((a, b) => b.trophies - a.trophies).map((club, i) => (
              <li key={club.tag}>
                <Link
                  href={`/clubs/${encodeURIComponent(club.tag.replace(/^#/, ""))}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-panel2"
                >
                  <span className="rank-index w-7 shrink-0 text-xs text-zest">{i + 1}</span>
                  <span className="flex-1 truncate font-display text-sm font-medium text-paper">
                    {club.name}
                  </span>
                  <TrophyGlyph className="h-4 w-4" />
                  <span className="stat-mono shrink-0 text-sm font-semibold text-zest2">
                    {formatNumber(club.trophies)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* MEILLEURS PUSHEURS — top 5 en direct */}
        <section className="mx-auto mt-6 max-w-4xl">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xs uppercase tracking-[0.2em] text-steel-400">
              Meilleurs pusheurs
            </h2>
            <Link href="/pusheurs" className="text-xs text-signal hover:underline">
              Voir tout →
            </Link>
          </div>
          {pushRows.length > 0 ? (
            <ol className="mt-3 divide-y divide-paper/10 rounded-2xl border border-paper/10 bg-panel">
              {pushRows.slice(0, 5).map((row, i) => (
                <li key={row.tag}>
                  <Link
                    href={`/joueurs/${encodeURIComponent(row.tag.replace(/^#/, ""))}`}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-panel2"
                  >
                    <span className="rank-index w-7 shrink-0 text-xs text-zest">{i + 1}</span>
                    <span className="flex-1 truncate font-display text-sm font-medium text-paper">
                      {row.name}
                    </span>
                    <span className="stat-mono shrink-0 text-sm font-semibold text-signal">
                      +{formatNumber(row.delta)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 rounded-2xl border border-paper/10 bg-panel px-4 py-4 text-center text-xs text-steel-400">
              Pas encore de photo de départ pour cette saison.
            </p>
          )}
        </section>

        {/* MEILLEURS ELOS — top 5 en direct */}
        <section className="mx-auto mt-6 max-w-4xl">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.2em] text-steel-400">
              <SwordsGlyph className="h-3.5 w-3.5" /> Meilleurs Elos
            </h2>
            <Link href="/classement?tab=ranked" className="text-xs text-signal hover:underline">
              Voir tout →
            </Link>
          </div>
          {rankedTracking.filter((r) => r.current > 0).length > 0 ? (
            <ol className="mt-3 divide-y divide-paper/10 rounded-2xl border border-paper/10 bg-panel">
              {[...rankedTracking]
                .filter((r) => r.current > 0)
                .sort((a, b) => b.current - a.current)
                .slice(0, 5)
                .map((row, i) => (
                  <li key={row.tag}>
                    <Link
                      href={`/joueurs/${encodeURIComponent(row.tag.replace(/^#/, ""))}`}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-panel2"
                    >
                      <span className="rank-index w-7 shrink-0 text-xs text-signal">{i + 1}</span>
                      <span className="flex-1 truncate font-display text-sm font-medium text-paper">
                        {row.name}
                      </span>
                      <span className="stat-mono shrink-0 text-sm font-semibold text-signal">
                        {formatNumber(row.current)}
                      </span>
                    </Link>
                  </li>
                ))}
            </ol>
          ) : (
            <p className="mt-3 rounded-2xl border border-paper/10 bg-panel px-4 py-4 text-center text-xs text-steel-400">
              Suivi Ranked pas encore alimenté — revient après quelques combats joués.
            </p>
          )}
        </section>

        {/* À PROPOS */}
        <section className="mx-auto mt-10 max-w-3xl rounded-2xl border border-paper/10 bg-panel px-6 py-6 text-center">
          <h2 className="font-display text-xs uppercase tracking-[0.2em] text-steel-400">À propos</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-steel-400">
            Purple Corp est une communauté Brawl Stars qui regroupe plusieurs clubs compétitifs,
            unis autour de la performance, l&apos;esprit d&apos;équipe et la progression continue.
          </p>
          <Link
            href={PURPLE_CORP_DISCORD_URL}
            className="mt-3 inline-block text-xs text-signal hover:underline"
          >
            {PURPLE_CORP_DISCORD_URL}
          </Link>
        </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
