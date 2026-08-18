import Image from "next/image";
import Link from "next/link";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import Navbar from "@/components/Navbar";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

// La page d'accueil est la "bannière" de Purple Corp : logo, trophées
// cumulés de TOUS les clubs réunis, puis un aperçu de chaque club.
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
      <main className="min-h-screen px-4 py-14 sm:px-8 lg:px-16">
        <section className="mx-auto max-w-3xl text-center">
          <Image
            src="/logo.png"
            alt="Purple Corp"
            width={120}
            height={120}
            className="mx-auto h-28 w-28"
          />
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Purple Corp
          </h1>
          <p className="mt-3 text-sm text-ash">
            {loadedClubs.length} clubs · {totalMembers} membres · toutes les stats en direct
          </p>

          <div className="mt-8 inline-flex flex-col items-center rounded-2xl border border-line bg-panel px-10 py-6 shadow-chip">
            <span className="stat-mono text-5xl font-bold text-zest sm:text-6xl">
              {formatNumber(totalTrophies)}
            </span>
            <span className="mt-1 font-display text-xs uppercase tracking-[0.25em] text-ash">
              Trophées cumulés · tous clubs
            </span>
          </div>
        </section>

        <section className="mx-auto mt-14 grid max-w-3xl gap-4 sm:grid-cols-2">
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
                className="rounded-2xl border border-line bg-panel p-6 text-left shadow-chip transition hover:border-zest"
              >
                <p className="font-display text-lg font-bold text-white">{club.name}</p>
                <p className="mt-1 text-xs text-ash">{club.members.length} membres</p>
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

        <section className="mx-auto mt-12 flex max-w-3xl justify-center gap-4">
          <Link
            href="/classement"
            className="rounded-full border border-line px-5 py-2 font-display text-xs font-semibold uppercase tracking-[0.1em] text-white transition hover:border-zest hover:text-zest"
          >
            Voir le classement global
          </Link>
          <Link
            href="/pusheurs"
            className="rounded-full border border-line px-5 py-2 font-display text-xs font-semibold uppercase tracking-[0.1em] text-white transition hover:border-zest hover:text-zest"
          >
            Voir les pusheurs
          </Link>
        </section>
      </main>
    </>
  );
}
