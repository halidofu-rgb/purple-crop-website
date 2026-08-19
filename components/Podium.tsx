import Link from "next/link";

export interface PodiumEntry {
  tag: string;
  name: string;
  clubName: string;
  value: number;
}

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

// Podium graphique pour les 3 premiers — le #1 au centre, plus grand,
// entouré du #2 et #3, façon estrade de compétition.
export default function Podium({ entries }: { entries: PodiumEntry[] }) {
  const [first, second, third] = entries;
  if (!first) return null;

  const heights: Record<number, string> = { 1: "h-28", 2: "h-20", 3: "h-14" };
  const order = [second, first, third];

  return (
    <div className="mb-8 flex items-end justify-center gap-3 sm:gap-5">
      {order.map((entry, idx) => {
        if (!entry) return <div key={idx} className="w-24 sm:w-32" />;
        const place = entry === first ? 1 : entry === second ? 2 : 3;
        const accent = place === 1 ? "text-zest" : place === 2 ? "text-zest2" : "text-ash";
        return (
          <Link
            key={entry.tag}
            href={`/joueurs/${encodeURIComponent(entry.tag.replace(/^#/, ""))}`}
            className="group flex w-24 flex-col items-center sm:w-32"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel2 font-display text-sm font-bold ${accent} transition group-hover:border-zest sm:h-12 sm:w-12`}
            >
              {entry.name.trim().charAt(0).toUpperCase()}
            </span>
            <p className="mt-2 max-w-full truncate font-display text-xs font-medium text-white sm:text-sm">
              {entry.name}
            </p>
            <p className="stat-mono text-xs text-ash sm:text-sm">{formatNumber(entry.value)}</p>
            <div
              className={`mt-2 flex w-full items-center justify-center rounded-t-lg border border-b-0 border-line bg-panel font-display text-lg font-bold ${accent} ${heights[place]}`}
            >
              {place}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
