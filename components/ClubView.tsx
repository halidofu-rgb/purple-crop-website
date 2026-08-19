import Link from "next/link";
import { Club, sortByTrophies } from "@/lib/brawlstars";

const ROLE_LABEL: Record<string, string> = {
  president: "Président",
  vicePresident: "Vice-président",
  senior: "Ancien",
  member: "Membre",
};

const TYPE_LABEL: Record<string, string> = {
  open: "Ouvert à tous",
  inviteOnly: "Sur invitation",
  closed: "Fermé",
};

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

export default function ClubView({ club }: { club: Club }) {
  const roster = sortByTrophies(club.members);

  return (
    <main className="min-h-screen px-4 py-10 sm:px-8 lg:px-16">
      {/* HERO : le nombre de trophées est le vrai sujet de la page, donc
          il porte toute la scène — pas de photo de couverture générique. */}
      <section className="mx-auto max-w-4xl text-center">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-signal">
          {TYPE_LABEL[club.type] ?? club.type} · {formatNumber(club.requiredTrophies)} trophées requis
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          {club.name}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ash">
          {club.description || "Pas de description."}
        </p>

        <div className="mt-10 inline-flex flex-col items-center rounded-2xl border border-line bg-panel px-10 py-6 shadow-chip">
          <span className="stat-mono text-5xl font-bold text-zest sm:text-6xl">
            {formatNumber(club.trophies)}
          </span>
          <span className="mt-1 font-display text-xs uppercase tracking-[0.25em] text-ash">
            Trophées cumulés · {club.members.length} membres
          </span>
        </div>
      </section>

      {/* ROSTER : chaque ligne est une plaque de score, pas une ligne de
          tableau — le rang mord dans la carte via le clip-path. */}
      <section className="mx-auto mt-14 max-w-3xl">
        <h2 className="mb-4 font-display text-sm uppercase tracking-[0.2em] text-ash">
          Effectif
        </h2>
        <ol className="space-y-2">
          {roster.map((member, i) => (
            <li key={member.tag}>
              <Link
                href={`/joueurs/${encodeURIComponent(member.tag.replace(/^#/, ""))}`}
                className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-line bg-panel py-3 pl-14 pr-4 transition hover:border-zest"
              >
                <span
                  className="absolute left-0 top-0 flex h-full w-11 items-center justify-center bg-panel2 font-display text-sm font-bold text-zest"
                  style={{ clipPath: "polygon(0 0, 100% 0, 78% 100%, 0 100%)" }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-white">
                    {member.name}
                  </p>
                  <p className="text-xs text-ash">{ROLE_LABEL[member.role] ?? member.role}</p>
                </div>
                <span className="stat-mono shrink-0 text-lg font-semibold text-zest2">
                  {formatNumber(member.trophies)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
