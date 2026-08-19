import Image from "next/image";
import Link from "next/link";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import Navbar from "@/components/Navbar";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

export default async function HomePage() {
  const tags = clubTags();

  const results = await Promise.all(
    tags.map(async (tag) => {
      try {
        const club = await getClub(tag);
        return { tag, club, error: null as string | null };
      } catch (err) {
        return { tag, club: null, error: (err as Error).message };
      }
    })
  );

  const loadedClubs = results.filter((r) => r.club).map((r) => r.club!);
  const totalTrophies = loadedClubs.reduce((sum, c) => sum + c.trophies, 0);
  const totalMembers = loadedClubs.reduce((sum, c) => sum + c.members.length, 0);

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-4 py-10 sm:px-8 lg:px-16">
        {/* Le hero est un panneau de "télémétrie" : le nombre de trophées
            porte la scène, encadré par la signature du site, plutôt qu'un
            logo géant centré au-dessus d'un titre. */}
        <section className="hud-frame mx-auto max-w-4xl bg-panel px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="" width={52} height={52} className="h-12 w-12 sm:h-[52px] sm:w-[52px]" />
              <div>
                <p className="font-display text-[11px] uppercase tracking-[0.3em] text-signal">
                  Flux en direct
                </p>
                <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Purple Corp
                </h1>
              </div>
            </div>

            <dl className="flex gap-8 font-mono text-xs text-ash">
              <div>
                <dt className="uppercase tracking-wide">Clubs</dt>
                <dd className="stat-mono mt-0.5 text-base text-white">{loadedClubs.length}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide">Membres</dt>
                <dd className="stat-mono mt-0.5 text-base text-white">{totalMembers}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 border-t border-line pt-8">
            <p className="stat-mono text-5xl font-semibold text-zest sm:text-6xl">
              {formatNumber(totalTrophies)}
            </p>
            <p className="mt-1 font-display text-xs uppercase tracking-[0.25em] text-ash">
              Trophées cumulés · tous clubs
            </p>
          </div>
        </section>

        <section className="mx-auto mt-6 grid max-w-4xl gap-4 sm:grid-cols-2">
          {results.map(({ tag, club, error }) => {
            if (error || !club) {
              return (
                <div key={tag} className="rounded-2xl border border-line bg-panel p-6 text-left">
                  <p className="font-display text-sm font-semibold text-blush">Erreur pour {tag}</p>
                  <p className="mt-1 text-xs text-ash">{error}</p>
                </div>
              );
            }
            return (
              <Link
                key={tag}
                href={`/clubs/${encodeURIComponent(tag.replace(/^#/, ""))}`}
                className="group rounded-2xl border border-line bg-panel p-6 text-left transition hover:border-zest"
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg font-semibold text-white">{club.name}</p>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ash transition group-hover:text-signal">
                    ouvrir →
                  </span>
                </div>
                <p className="mt-1 text-xs text-ash">{club.members.length} membres</p>
                <p className="stat-mono mt-5 text-3xl font-semibold text-zest">
                  {formatNumber(club.trophies)}
                </p>
                <p className="font-display text-[11px] uppercase tracking-[0.2em] text-ash">
                  trophées cumulés
                </p>
              </Link>
            );
          })}
        </section>

        <section className="mx-auto mt-8 flex max-w-4xl justify-center gap-3">
          <Link
            href="/classement"
            className="rounded-full border border-line px-5 py-2 font-display text-xs uppercase tracking-[0.1em] text-white transition hover:border-zest hover:text-zest"
          >
            Classement global
          </Link>
          <Link
            href="/pusheurs"
            className="rounded-full border border-line px-5 py-2 font-display text-xs uppercase tracking-[0.1em] text-white transition hover:border-signal hover:text-signal"
          >
            Pusheurs
          </Link>
        </section>
      </main>
    </>
  );
}
