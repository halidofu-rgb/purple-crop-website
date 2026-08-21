import Link from "next/link";
import RankTierIcon from "@/components/RankTierIcon";
import { avatarColor } from "@/lib/avatarColor";

export interface PodiumEntry {
  tag: string;
  name: string;
  clubName: string;
  value: number;
  delta?: number;
  rankIconSrc?: string | null;
  rankLabel?: string;
}

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

// Top 3 en trois cartes de même hauteur : seul le #1 porte la lueur violette
// (la charte réserve la saturation à un seul élément par écran).
export default function Podium({ entries }: { entries: PodiumEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.slice(0, 3).map((entry, i) => {
        const lead = i === 0;
        return (
          <Link
            key={entry.tag}
            href={`/joueurs/${encodeURIComponent(entry.tag.replace(/^#/, ""))}`}
            className={`relative overflow-hidden rounded-2xl px-6 py-6 no-underline transition ${
              lead
                ? "border border-zest2/40 bg-gradient-to-br from-iris/70 to-panel/85 hover:border-zest2/70"
                : "border border-paper/15 bg-gradient-to-br from-panel/95 to-ink/70 hover:border-paper/30"
            }`}
          >
            {lead && (
              <span className="pointer-events-none absolute -top-[70px] -right-[70px] h-[230px] w-[230px] rounded-full bg-[radial-gradient(circle,rgba(181,171,252,0.28),transparent_65%)]" />
            )}

            <div className="relative mb-5 flex items-center justify-between">
              <span className={`rank-index text-[13px] tracking-[0.08em] ${lead ? "text-zest2" : "text-ash"}`}>
                [{String(i + 1).padStart(2, "0")}]
              </span>
              <span
                className={`rounded-md px-2.5 py-1 text-[10.5px] uppercase tracking-[0.14em] ${
                  lead ? "border border-zest2/40 bg-iris/60 text-zest2" : "border border-paper/15 text-steel-400"
                }`}
              >
                {entry.clubName}
              </span>
            </div>

            <div className="relative flex items-center gap-3.5">
              <span
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[17px] font-medium text-ink"
                style={{ backgroundColor: avatarColor(entry.name) }}
              >
                {entry.name.trim().charAt(0).toUpperCase()}
                {entry.rankLabel && (
                  <RankTierIcon
                    src={entry.rankIconSrc ?? null}
                    label={entry.rankLabel}
                    className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border border-panel bg-panel2 p-0.5"
                  />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[23px] leading-tight tracking-[-0.02em] text-paper">{entry.name}</p>
                {entry.rankLabel && <p className="mt-0.5 truncate text-xs text-ash">{entry.rankLabel}</p>}
              </div>
            </div>

            <div className="relative mt-5 flex items-end justify-between border-t border-paper/10 pt-4">
              <span className="stat-mono whitespace-nowrap text-[28px] leading-none tracking-[-0.02em] text-paper">
                {formatNumber(entry.value)}
              </span>
              {entry.delta !== undefined && (
                <span className={`text-xs ${entry.delta >= 0 ? "text-signal" : "text-blush"}`}>
                  {entry.delta >= 0 ? "+" : ""}
                  {formatNumber(entry.delta)}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
