import { getSnapshots } from "@/lib/kv";
import Navbar from "@/components/Navbar";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

interface PushRow {
  tag: string;
  name: string;
  clubName: string;
  before: number;
  after: number;
  delta: number;
}

export default async function PusheursPage() {
  let snapshots: Awaited<ReturnType<typeof getSnapshots>> = [];
  let error: string | null = null;

  try {
    snapshots = await getSnapshots(2);
  } catch (err) {
    error = (err as Error).message;
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[70vh] items-center justify-center px-6 text-center">
          <div>
            <h1 className="font-display text-2xl font-bold text-blush">
              Historique pas encore configuré
            </h1>
            <p className="mt-2 max-w-md text-sm text-ash">{error}</p>
          </div>
        </main>
      </>
    );
  }

  if (snapshots.length < 2) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[70vh] items-center justify-center px-6 text-center">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Pas encore assez d&apos;historique
            </h1>
            <p className="mt-2 max-w-md text-sm text-ash">
              {snapshots.length === 0
                ? "Aucune photo n'a encore été prise. La première capture automatique arrivera avec le prochain passage du cron (voir README pour forcer une capture manuelle)."
                : "Une seule photo existe pour l'instant — reviens demain, ou force une deuxième capture manuelle pour voir apparaître les écarts."}
            </p>
          </div>
        </main>
      </>
    );
  }

  const [latest, previous] = snapshots;
  const previousByTag = new Map(previous.players.map((p) => [p.tag, p]));

  const rows: PushRow[] = latest.players
    .map((p) => {
      const before = previousByTag.get(p.tag);
      if (!before) return null;
      return {
        tag: p.tag,
        name: p.name,
        clubName: p.clubName,
        before: before.trophies,
        after: p.trophies,
        delta: p.trophies - before.trophies,
      };
    })
    .filter((r): r is PushRow => r !== null)
    .sort((a, b) => b.delta - a.delta);

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-4 py-10 sm:px-8 lg:px-16">
        <section className="mx-auto max-w-3xl text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-signal">
            Purple Corp
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Pusheurs
          </h1>
          <p className="mt-3 text-sm text-ash">
            Écart de trophées entre le {formatDate(previous.date)} et le {formatDate(latest.date)}.
          </p>
        </section>

        <section className="mx-auto mt-10 max-w-3xl">
          <ol className="space-y-2">
            {rows.map((row, i) => (
              <li
                key={row.tag}
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
                    {row.name}
                  </p>
                  <p className="text-xs text-ash">{row.clubName}</p>
                </div>
                <span
                  className={`stat-mono shrink-0 text-lg font-semibold ${
                    row.delta >= 0 ? "text-signal" : "text-blush"
                  }`}
                >
                  {row.delta >= 0 ? "+" : ""}
                  {formatNumber(row.delta)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}
