import Link from "next/link";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline } from "@/lib/kv";
import { getCurrentSeason } from "@/lib/season";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClubBadge from "@/components/ClubBadge";
import PageBanner from "@/components/PageBanner";

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
  const totalMembers = loadedClubs.reduce((sum, c) => sum + c.members.length, 0);

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
      <main className="min-h-screen animate-fadeInUp px-4 pb-20 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-[1160px]">
          <PageBanner
            kicker="La communauté"
            title="Nos clubs"
            intro="Purple Corp regroupe plusieurs clubs Brawl Stars. Choisis-en un pour voir sa fiche complète."
            stats={[
              { value: String(loadedClubs.length), label: "Clubs" },
              { value: formatNumber(totalMembers), label: "Membres" },
            ]}
          />

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {results.map(({ tag, club, error }) => {
              if (error || !club) {
                return (
                  <div key={tag} className="rounded-2xl border border-blush/30 bg-panel p-6">
                    <p className="text-sm font-medium text-blush">Erreur pour {tag}</p>
                    <p className="mt-1 text-xs text-steel-400">{error}</p>
                  </div>
                );
              }

              const push = clubPush.get(club.tag);
              const position = ranked.findIndex((c) => c.tag === club.tag) + 1;
              const lead = position === 1;

              return (
                <Link
                  key={tag}
                  href={`/clubs/${encodeURIComponent(tag.replace(/^#/, ""))}`}
                  className={`relative block overflow-hidden rounded-2xl px-7 py-6 no-underline transition ${
                    lead
                      ? "border border-zest2/40 bg-gradient-to-br from-iris/60 to-panel/90 hover:border-zest2/75"
                      : "border border-paper/10 bg-panel hover:border-paper/30"
                  }`}
                >
                  {lead && (
                    <span className="pointer-events-none absolute -top-[70px] -right-[70px] h-[240px] w-[240px] rounded-full bg-[radial-gradient(circle,rgba(181,171,252,0.26),transparent_65%)]" />
                  )}

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <ClubBadge tag={club.tag} badgeId={club.badgeId} size={40} />
                      <div className="min-w-0">
                        <p className="truncate text-[22px] leading-tight tracking-[-0.02em] text-paper">
                          {club.name}
                        </p>
                        <p className="stat-mono mt-0.5 text-[11.5px] text-steel-600">{club.tag}</p>
                      </div>
                    </div>
                    <span
                      className={`rank-index shrink-0 text-xs tracking-[0.08em] ${
                        lead ? "text-zest2" : "text-ash"
                      }`}
                    >
                      [{String(position).padStart(2, "0")}]
                    </span>
                  </div>

                  <div className="relative mt-5 flex flex-wrap gap-2">
                    <span className="rounded-md border border-paper/15 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.12em] text-steel-400">
                      {club.members.length} membres
                    </span>
                    <span className="rounded-md border border-paper/15 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.12em] text-steel-400">
                      {formatNumber(club.requiredTrophies)} req.
                    </span>
                    {push !== undefined && (
                      <span
                        className={`stat-mono rounded-md px-2.5 py-1 text-[10.5px] ${
                          push >= 0
                            ? "border border-signal/35 bg-signal/10 text-signal"
                            : "border border-paper/15 text-blush"
                        }`}
                      >
                        {push >= 0 ? "+" : "−"}
                        {formatNumber(Math.abs(push))} push
                      </span>
                    )}
                  </div>

                  <div className="relative mt-6 flex items-end justify-between border-t border-paper/10 pt-4">
                    <div>
                      <p className="stat-mono whitespace-nowrap text-[32px] leading-none tracking-[-0.02em] text-zest2">
                        {formatNumber(club.trophies)}
                      </p>
                      <p className="mt-1.5 text-[10.5px] uppercase tracking-[0.14em] text-ash">
                        trophées cumulés
                      </p>
                    </div>
                    <span
                      className={`text-[11px] uppercase tracking-[0.14em] ${
                        lead ? "text-zest2" : "text-steel-400"
                      }`}
                    >
                      Voir →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
