import { getPlayer } from "@/lib/brawlstars";
import Navbar from "@/components/Navbar";
import { notFound } from "next/navigation";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function rankIndex(i: number): string {
  return `[${String(i + 1).padStart(2, "0")}]`;
}

export default async function PlayerPage({ params }: { params: { tag: string } }) {
  let player;
  try {
    player = await getPlayer(params.tag);
  } catch (err) {
    console.error(err);
    notFound();
  }

  const brawlers = [...player.brawlers].sort((a, b) => b.trophies - a.trophies);
  const totalVictories =
    player.soloVictories + player.duoVictories + player["3vs3Victories"];

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-4 py-10 sm:px-8 lg:px-16">
        <section className="hud-frame mx-auto max-w-3xl bg-panel px-6 py-8 text-center sm:px-10 sm:py-10">
          {player.club && (
            <p className="font-display text-xs uppercase tracking-[0.3em] text-signal">
              {player.club.name}
            </p>
          )}
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {player.name}
          </h1>
          <p className="mt-1 font-mono text-xs text-ash">Niveau d&apos;XP {player.expLevel}</p>

          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-line pt-8 sm:grid-cols-4">
            <div>
              <p className="stat-mono text-2xl font-semibold text-zest">
                {formatNumber(player.trophies)}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-ash">Trophées</p>
            </div>
            <div>
              <p className="stat-mono text-2xl font-semibold text-zest2">
                {formatNumber(player.highestTrophies)}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-ash">Record perso</p>
            </div>
            <div>
              <p className="stat-mono text-2xl font-semibold text-signal">
                {formatNumber(totalVictories)}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-ash">Victoires totales</p>
            </div>
            <div>
              <p className="stat-mono text-2xl font-semibold text-white">{brawlers.length}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-ash">Brawlers</p>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-3xl">
          <h2 className="mb-4 font-display text-xs uppercase tracking-[0.2em] text-ash">
            Ses meilleurs brawlers
          </h2>
          <ol className="divide-y divide-line rounded-2xl border border-line bg-panel">
            {brawlers.slice(0, 15).map((b, i) => (
              <li key={b.id} className="flex items-center gap-4 px-4 py-3">
                <span className="rank-index w-9 shrink-0 text-xs text-zest">
                  {rankIndex(i)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-medium text-white">
                    {b.name}
                  </p>
                  <p className="text-xs text-ash">Puissance {b.power}</p>
                </div>
                <span className="stat-mono shrink-0 text-base font-semibold text-zest2">
                  {formatNumber(b.trophies)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}
