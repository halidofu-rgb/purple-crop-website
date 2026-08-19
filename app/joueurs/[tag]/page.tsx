import { getPlayer } from "@/lib/brawlstars";
import Navbar from "@/components/Navbar";
import { notFound } from "next/navigation";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
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
        <section className="mx-auto max-w-3xl text-center">
          {player.club && (
            <p className="font-display text-xs uppercase tracking-[0.3em] text-signal">
              {player.club.name}
            </p>
          )}
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {player.name}
          </h1>
          <p className="mt-1 text-xs text-ash">Niveau d&apos;XP {player.expLevel}</p>
        </section>

        <section className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-line bg-panel p-4 text-center">
            <p className="stat-mono text-2xl font-bold text-zest">
              {formatNumber(player.trophies)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-ash">Trophées</p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4 text-center">
            <p className="stat-mono text-2xl font-bold text-zest2">
              {formatNumber(player.highestTrophies)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-ash">Record perso</p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4 text-center">
            <p className="stat-mono text-2xl font-bold text-signal">
              {formatNumber(totalVictories)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-ash">Victoires totales</p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4 text-center">
            <p className="stat-mono text-2xl font-bold text-white">{brawlers.length}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-ash">Brawlers</p>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-3xl">
          <h2 className="mb-4 font-display text-sm uppercase tracking-[0.2em] text-ash">
            Ses meilleurs brawlers
          </h2>
          <ol className="space-y-2">
            {brawlers.slice(0, 15).map((b, i) => (
              <li
                key={b.id}
                className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-line bg-panel py-3 pl-14 pr-4"
              >
                <span
                  className="absolute left-0 top-0 flex h-full w-11 items-center justify-center bg-panel2 font-display text-sm font-bold text-zest"
                  style={{ clipPath: "polygon(0 0, 100% 0, 78% 100%, 0 100%)" }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-white">
                    {b.name}
                  </p>
                  <p className="text-xs text-ash">Puissance {b.power}</p>
                </div>
                <span className="stat-mono shrink-0 text-lg font-semibold text-zest2">
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
