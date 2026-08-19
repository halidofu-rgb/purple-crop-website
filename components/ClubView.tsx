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

function rankIndex(i: number): string {
  return `[${String(i + 1).padStart(2, "0")}]`;
}

export default function ClubView({
  club,
  clubRank,
  totalClubs,
}: {
  club: Club;
  clubRank?: number;
  totalClubs?: number;
}) {
  const roster = sortByTrophies(club.members);
  const best = roster[0];
  const average = roster.length > 0 ? Math.round(club.trophies / roster.length) : 0;

  return (
    <main className="min-h-screen px-4 py-10 sm:px-8 lg:px-16">
      <section className="hud-frame mx-auto max-w-4xl bg-panel px-6 py-8 text-center sm:px-10 sm:py-10">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-signal">
          {TYPE_LABEL[club.type] ?? club.type} · {formatNumber(club.requiredTrophies)} trophées requis
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {club.name}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ash">
          {club.description || "Pas de description."}
        </p>

        <div className="mt-8 border-t border-line pt-8">
          <p className="stat-mono text-5xl font-semibold text-zest sm:text-6xl">
            {formatNumber(club.trophies)}
          </p>
          <p className="mt-1 font-display text-xs uppercase tracking-[0.25em] text-ash">
            Trophées cumulés · {club.members.length} membres
          </p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-6">
          <div>
            <p className="stat-mono text-xl font-semibold text-white">
              {formatNumber(average)}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ash">
              Moyenne / membre
            </p>
          </div>
          <div>
            <p className="truncate font-display text-sm font-semibold text-white">
              {best ? best.name : "—"}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ash">Meilleur joueur</p>
          </div>
          <div>
            <p className="stat-mono text-xl font-semibold text-white">
              {clubRank ? `#${clubRank}` : "—"}
              {totalClubs ? <span className="text-ash"> / {totalClubs}</span> : null}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ash">
              Rang dans Purple Corp
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-3xl">
        <h2 className="mb-4 font-display text-xs uppercase tracking-[0.2em] text-ash">
          Effectif
        </h2>
        <ol className="divide-y divide-line rounded-2xl border border-line bg-panel">
          {roster.map((member, i) => (
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
                  <p className="text-xs text-ash">{ROLE_LABEL[member.role] ?? member.role}</p>
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
  );
}
