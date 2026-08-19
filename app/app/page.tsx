import Image from "next/image";
import Link from "next/link";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline } from "@/lib/kv";
import { getRankedRows } from "@/lib/ranked";
import { getCurrentSeason, formatCountdown } from "@/lib/season";
import { PURPLE_CORP_DISCORD_URL, PURPLE_CORP_FOUNDER } from "@/lib/site";
import Navbar from "@/components/Navbar";
import RankGlyph from "@/components/RankGlyph";
import Button from "@/components/Button";

// La partie "meilleur pusher" dépend de Redis, pas du cache fetch() —
// on garde la page toujours calculée à la demande.
export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
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
  const bestClub = [...loadedClubs].sort((a, b) => b.trophies - a.trophies)[0];
  const bestPlayer = loadedClubs
    .flatMap((c) => c.members.map((m) => ({ ...m, clubName: c.name })))
    .sort((a, b) => b.trophies - a.trophies)[0];

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
        {/* BIENVENUE — logo, présentation, un bouton par club */}
        <section className="mx-auto max-w-4xl text-center">
          <Image src="/logo.png" alt="" width={72} height={72} className="mx-auto h-16 w-16 sm:h-[72px] sm:w-[72px]" />
          <p className="mt-4 font-display text-xs uppercase tracking-[0.3em] text-signal">
            Bienvenue sur
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Purple Corp
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-ash">
            Le suivi en direct de nos clubs Brawl Stars : trophées, classement général et qui
            pousse le plus fort cette saison.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {clubResults.map(({ tag, club }) =>
              club ? (
                <Button key={tag} href={`/clubs/${encodeURIComponent(tag.replace(/^#/, ""))}`} variant="secondary">
                  {club.name}
                </Button>
              ) : null
            )}
          </div>
        </section>

        {/* DISCORD — le vrai serveur commun à toute la structure */}
        <section className="hud-frame mx-auto mt-10 max-w-4xl bg-panel px-6 py-6 text-center sm:px-10">
          <p className="font-display text-sm font-semibold text-white">
            Rejoins-nous sur le Discord Purple Corp
          </p>
          <p className="mt-1 text-xs text-ash">
            Discussions, recrutement, annonces des deux clubs — tout se passe là-bas.
          </p>
          <div className="mt-4">
            <Button href={PURPLE_CORP_DISCORD_URL} variant="primary">
              Rejoindre le Discord
            </Button>
          </div>
        </section>

        {/* 5 INDICATEURS — non cliquables, juste informatifs */}
        <section className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-line bg-panel p-4 text-center">
            <p className="stat-mono text-xl font-semibold text-zest">
              {formatNumber(totalTrophies)}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-ash">Trophées totaux</p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4 text-center">
            <p className="stat-mono text-xl font-semibold text-white">{totalMembers}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-ash">Joueurs</p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4 text-center">
            <p className="flex items-center justify-center gap-1 stat-mono text-sm font-semibold text-ash">
              <RankGlyph className="h-3.5 w-3.5" />
              {rankedKing ? `+${formatNumber(rankedKing.delta)}` : "Bientôt"}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-ash">Meilleur Elo Ranked</p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4 text-center">
            <p className="truncate stat-mono text-sm font-semibold text-signal">
              {king ? king.name : "—"}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-ash">Meilleur pusheur</p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4 text-center">
            <p className="font-display text-sm font-semibold text-white">{season.label}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-ash">
              ⏳ {formatCountdown(season.end)}
            </p>
          </div>
        </section>

        {/* NOTRE HISTOIRE */}
        <section className="mx-auto mt-10 max-w-3xl rounded-2xl border border-line bg-panel px-6 py-6 text-center sm:px-10">
          <p className="font-display text-xs uppercase tracking-[0.2em] text-ash">Notre histoire</p>
          <p className="mt-3 text-sm leading-relaxed text-ash">
            Purple Corp a été créé par <span className="text-white">{PURPLE_CORP_FOUNDER}</span>, et
            constitue aujourd&apos;hui {loadedClubs.length} clubs :{" "}
            {loadedClubs.map((c) => c.name).join(" et ")}. À eux deux, ils rassemblent{" "}
            {totalMembers} joueurs pour un total de {formatNumber(totalTrophies)} trophées cumulés
            {bestClub && (
              <>
                , avec <span className="text-white">{bestClub.name}</span> en tête du classement
                interne
              </>
            )}
            {bestPlayer && (
              <>
                {" "}
                et <span className="text-white">{bestPlayer.name}</span> comme meilleur joueur de la
                structure avec {formatNumber(bestPlayer.trophies)} trophées.
              </>
            )}
          </p>
        </section>

        {/* 3 BLOCS CLIQUABLES */}
        <section className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
          <Link href="/clubs" className="card-lift rounded-2xl border border-line bg-panel p-6 text-center shadow-card">
            <p className="font-display text-sm font-semibold text-white">Nos clubs</p>
            <p className="mt-1 text-xs text-ash">Purple Line, Indigo Line et les prochains</p>
          </Link>
          <Link href="/pusheurs" className="card-lift rounded-2xl border border-line bg-panel p-6 text-center shadow-card">
            <p className="font-display text-sm font-semibold text-white">Meilleurs pusheurs</p>
            <p className="mt-1 text-xs text-ash">Le classement du push, saison en cours</p>
          </Link>
          <Link href="/classement?tab=ranked" className="card-lift rounded-2xl border border-line bg-panel p-6 text-center shadow-card">
            <p className="flex items-center justify-center gap-1.5 font-display text-sm font-semibold text-white">
              <RankGlyph className="h-3.5 w-3.5" /> Meilleurs Elos
            </p>
            <p className="mt-1 text-xs text-ash">Activité Ranked récente de chacun</p>
          </Link>
        </section>
      </main>
    </>
  );
}
