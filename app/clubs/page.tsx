import Link from "next/link";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import Navbar from "@/components/Navbar";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

export default async function ClubsListPage() {
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

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-4 py-10 sm:px-8 lg:px-16">
        <section className="mx-auto max-w-3xl text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-signal">
            La communauté
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
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
      </main>
    </>
  );
}
