import { TrophyHistoryPoint } from "@/lib/trophyHistory";
import { PushGlyph } from "@/components/icons";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
}

// Petit graphique en aire, sans dépendance externe (même logique que le
// reste du site : tout en SVG maison). viewBox en pourcentage + largeur
// 100% pour rester responsive sans recalcul JS.
export default function TrophyHistoryChart({ points }: { points: TrophyHistoryPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="rounded-2xl border border-paper/10 bg-panel p-6 text-center">
        <p className="text-sm text-steel-400">
          Historique pas encore assez fourni — un point est ajouté chaque jour, reviens dans
          quelques jours pour voir la tendance.
        </p>
      </div>
    );
  }

  const values = points.map((p) => p.trophies);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * 100;
    const y = 36 - ((p.trophies - min) / range) * 32; // 2px de marge haut/bas sur 40
    return { x, y };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1].x},40 L${coords[0].x},40 Z`;

  const first = points[0];
  const last = points[points.length - 1];
  const delta = last.trophies - first.trophies;

  return (
    <div className="rounded-2xl border border-paper/10 bg-panel p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.16em] uppercase text-steel-500">
            Progression — {points.length} derniers jours
          </p>
          <p className="mt-1 text-[11px] text-steel-600">
            {formatShortDate(first.date)} → {formatShortDate(last.date)}
          </p>
        </div>
        <span
          className={`stat-mono flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[13px] ${
            delta >= 0
              ? "border border-zest2/35 bg-zest/10 text-zest2"
              : "border border-paper/15 text-blush"
          }`}
        >
          {delta >= 0 && <PushGlyph className="h-3.5 w-3.5" />}
          {delta >= 0 ? "+" : ""}
          {formatNumber(delta)}
        </span>
      </div>

      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-28 w-full sm:h-32">
        <defs>
          <linearGradient id="trophy-history-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b5abfc" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#b5abfc" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#trophy-history-fill)" stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke="#b5abfc"
          strokeWidth="0.8"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      <div className="mt-3 flex justify-between text-[11px] text-steel-600">
        <span>
          Plus bas <span className="stat-mono text-steel-400">{formatNumber(min)}</span>
        </span>
        <span>
          Plus haut <span className="stat-mono text-steel-400">{formatNumber(max)}</span>
        </span>
      </div>
    </div>
  );
}
