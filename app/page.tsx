import Image from "next/image";
import Link from "next/link";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline } from "@/lib/kv";
import { getRankedRows } from "@/lib/ranked";
import { getCurrentSeason, formatCountdown } from "@/lib/season";
import { PURPLE_CORP_DISCORD_URL } from "@/lib/site";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import {
  Trophy,
  Users,
  Crown,
  Calendar,
  Shield,
  TrendingUp,
  MessageCircle,
  ArrowRight,
  Swords,
} from "lucide-react";

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

  const stats = [
    { icon: Trophy, value: formatNumber(totalTrophies), label: "Trophées totaux" },
    { icon: Users, value: String(totalMembers), label: "Joueurs" },
    {
      icon: Swords,
      value: rankedKing ? `+${formatNumber(rankedKing.delta)}` : "Bientôt",
      label: "Meilleur Elo Ranked",
    },
    { icon: Crown, value: king ? king.name : "—", label: "Meilleur pusheur" },
    { icon: Calendar, value: season.label, label: `⏳ ${formatCountdown(season.end)}` },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen animate-fadeInUp px-4 py-10 sm:px-8 lg:px-16">
        {/* BIENVENUE — logo, présentation, un bouton par club */}
        <section className="mx-auto max-w-4xl text-center">
          <Image src="/logo.png" alt="" width={80} height={80} className="mx-auto h-16 w-16 rounded-2xl sm:h-20 sm:w-20" />
          <p className="mt-5 font-display text-xs uppercase tracking-[0.3em] text-signal">
            Bienvenue sur
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Purple Corp
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-ash">
            Le suivi en direct de nos clubs Brawl Stars : trophées, classement général et qui
            pousse le plus fort cette saison.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {clubResults.map(({ tag, club }) =>
              club ? (
                <Button
                  key={tag}
                  href={`/clubs/${encodeURIComponent(tag.replace(/^#/, ""))}`}
                  variant="secondary"
                  size="lg"
                  icon={<Shield className="h-4 w-4" />}
                >
                  {club.name}
                </Button>
              ) : null
            )}
          </div>
        </section>

        {/* DISCORD — bloc premium avec dégradé */}
        <section className="relative mx-auto mt-12 max-w-4xl overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-panel via-panel to-[#241335] px-6 py-8 text-center sm:px-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-zest/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-signal/10 blur-3xl" />
          <div className="relative">
            <p className="font-display text-lg font-semibold text-white sm:text-xl">
              Rejoins-nous sur le Discord Purple Corp
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-ash">
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

        {/* 5 INDICATEURS — non cliquables, avec icône */}
        <section className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-5">
          {stats.map(({ icon: Icon, value, label }, i) => (
            <div
              key={i}
              className="rounded-2xl border border-line bg-panel p-4 text-center transition hover:border-zest/50"
            >
              <Icon className="mx-auto h-5 w-5 text-zest" />
              <p className="stat-mono mt-2 truncate text-lg font-semibold text-white">{value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-ash">{label}</p>
            </div>
          ))}
        </section>

        {/* NOTRE HISTOIRE */}
        <section className="mx-auto mt-10 max-w-3xl rounded-3xl border border-line bg-panel px-6 py-8 sm:px-10">
          <p className="font-display text-xs uppercase tracking-[0.25em] text-signal">
            Purple Corp – Plus qu&apos;un club, une famille
          </p>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-ash">
            <p>
              Bienvenue chez Purple Corp, le club Brawl Stars qui ne fait pas semblant. Fondé sur
              une ambition simple : rassembler les joueurs les plus motivés autour d&apos;une
              progression sérieuse et d&apos;un vrai esprit d&apos;équipe.
            </p>
            <p>
              Sous la présidence de <span className="text-white">Rapso</span>, notre club s&apos;est
              hissé parmi l&apos;élite française et mondiale : Top 14 monde et Top 9 France au
              record, aujourd&apos;hui stable en Top 70 France / Top 530 monde. Une performance qui
              reflète l&apos;exigence et la mentalité tryhard de notre ligne compétitive, la{" "}
              <span className="text-white">Purple Line</span> (125K+ trophées minimum).
            </p>
            <p>
              À côté de ça, notre <span className="text-white">Indigo Line</span> (100K+ trophées
              minimum) accueille les joueurs compétitifs qui veulent progresser dans une ambiance
              bienveillante, avec entraide, suivi et un Discord actif — actuellement Top 93 France.
            </p>
            <p>
              Ici, pas de place pour l&apos;individualisme : événements réguliers, communauté
              active, et un seul objectif — marquer les esprits.
            </p>
            <p className="font-display font-semibold text-white">Rejoins-nous.</p>
          </div>
        </section>

        {/* 3 BLOCS CLIQUABLES */}
        <section className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
          <Link
            href="/clubs"
            className="card-lift group flex flex-col items-center rounded-2xl border border-line bg-panel p-6 text-center shadow-card"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-zest/15 text-zest">
              <Shield className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display text-sm font-semibold text-white">Nos clubs</p>
            <p className="mt-1 text-xs text-ash">Purple Line, Indigo Line et les prochains</p>
            <span className="mt-3 flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-ash transition group-hover:text-zest">
              Découvrir <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
          <Link
            href="/pusheurs"
            className="card-lift group flex flex-col items-center rounded-2xl border border-line bg-panel p-6 text-center shadow-card"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-signal/15 text-signal">
              <TrendingUp className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display text-sm font-semibold text-white">Meilleurs pusheurs</p>
            <p className="mt-1 text-xs text-ash">Le classement du push, saison en cours</p>
            <span className="mt-3 flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-ash transition group-hover:text-signal">
              Découvrir <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
          <Link
            href="/classement?tab=ranked"
            className="card-lift group flex flex-col items-center rounded-2xl border border-line bg-panel p-6 text-center shadow-card"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blush/15 text-blush">
              <Swords className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display text-sm font-semibold text-white">Meilleurs Elos</p>
            <p className="mt-1 text-xs text-ash">Activité Ranked récente de chacun</p>
            <span className="mt-3 flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-ash transition group-hover:text-blush">
              Découvrir <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </section>
      </main>
    </>
  );
}
