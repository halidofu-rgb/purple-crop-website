import Link from "next/link";
import { getClub, ClubMember } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import Navbar from "@/components/Navbar";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function rankIndex(i: number): string {
  return `[${String(i + 1).padStart(2, "0")}]`;
}

interface Row extends ClubMember {
  clubName: string;
}

export default async function ClassementPage() {
  const tags = clubTags();
  const clubs = await Promise.all(
    tags.map(async (tag) => {
      try {
        return await getClub(tag);
      } catch {
        return null;
      }
    })
  );

  const rows: Row[] = clubs
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .flatMap((club) => club.members.map((m) => ({ ...m, clubName: club.name })))
    .sort((a, b) => b.trophies - a.trophies);

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-4 py-10 sm:px-8 lg:px-16">
        <section className="mx-auto max-w-3xl text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-signal">
            Purple Corp
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Classement général
          </h1>
          <p className="mt-3 text-sm text-ash">
            Tous les membres de tous les clubs, triés par trophées.
          </p>
        </section>

        <section className="mx-auto mt-10 max-w-3xl">
          <ol className="divide-y divide-line rounded-2xl border border-line bg-panel">
            {rows.map((member, i) => (
              <li key={member.tag}>
                <Link
                  href={`/joueurs/${encodeURIComponent(member.tag.replace(/^#/, ""))}`}
                  className="flex items-center gap-4 px-4 py-3 transition hover:bg-panel2"
                >
                  <span className="rank-index w-10 shrink-0 text-xs text-zest">
                    {rankIndex(i)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-medium text-white">
                      {member.name}
                    </p>
                    <p className="text-xs text-ash">{member.clubName}</p>
                  </div>
                  <span className="stat-mono shrink-0 text-base font-semibold text-zest2">
                    {formatNumber(member.trophies)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}
