import Link from "next/link";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline } from "@/lib/kv";
import { getCurrentSeason } from "@/lib/season";
import Navbar from "@/components/Navbar";
import ClubBadge from "@/components/ClubBadge";
import Badge from "@/components/Badge";

export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

export default async function ClubsListPage() {
  const tags = clubTags();
  const season = getCurrentSeason();

  const [results, baseline] = await Promise.all([
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
  ]);

  const loadedClubs = results.filter((r) => r.club).map((r) => r.club!);
  const ranked = [...loadedClubs].sort((a, b) => b.trophies - a.trophies);

  // Progression du club = somme des push individuels de ses membres,
  // seulement si une photo de départ de saison existe.
  const clubPush = new Map<string, number>();
  if (baseline) {
    const baselineByTag = new Map(baseline.players.map((p) => [p.tag, p]));
    for (const club of loadedClubs) {
      const total = club.members.reduce((sum, m) => {
        const before = baselineByTag.get(m.tag);
        return sum + (before ? m.trophies - before.trophies : 0);
      }, 0);
      clubPush.set(club.tag, total);
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen animate-fadeInUp px-4 py-10 sm:px-8 lg:px-16">
        <section className="mx-auto max-w-3xl text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-signal">
            La communauté
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Nos clubs
          </h1>
          <p className="mt-3 text-sm text-ash">
            Purple Corp regroupe plusieurs clubs Brawl Stars. Choisis-en un pour voir sa fiche complète.
          </p>
        </section>

        <section className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          {results.map(({ tag, club, error }) => {
            if (error || !club) {
              return (
                <div key={tag} className="rounded-2xl border border-line bg-panel p-6 text-left">
                  <p className="font-display text-sm font-semibold text-blush">Erreur pour {tag}</p>
                  <p className="mt-1 text-xs text-ash">{error}</p>
                </div>
              );
            }
            const push = clubPush.get(club.tag);
            const position = ranked.findIndex((c) => c.tag === club.tag) + 1;

            return (
              <Link
                key={tag}
                href={`/clubs/${encodeURIComponent(tag.replace(/^#/, ""))}`}
                className="card-lift rounded-2xl border border-line bg-panel p-6 text-left shadow-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <ClubBadge tag={club.tag} size={36} />
                    <div>
                      <p className="font-display text-lg font-bold text-white">{club.name}</p>
                      <p className="font-mono text-[11px] text-ash">{club.tag}</p>
                    </div>
                  </div>
                  <Badge tone="primary">#{position}</Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="neutral">{club.members.length} membres</Badge>
                  <Badge tone="neutral">{formatNumber(club.requiredTrophies)} req.</Badge>
                  {push !== undefined && (
                    <Badge tone={push >= 0 ? "success" : "danger"}>
                      {push >= 0 ? "+" : ""}
                      {formatNumber(push)} push
                    </Badge>
                  )}
                </div>

                <p className="stat-mono mt-4 text-3xl font-bold text-zest">
                  {formatNumber(club.trophies)}
                </p>
                <p className="font-display text-[11px] uppercase tracking-[0.2em] text-ash">
                  trophées cumulés
                </p>
              </Link>
            );
          })}
        </section>
      </main>
    </>
  );
}
