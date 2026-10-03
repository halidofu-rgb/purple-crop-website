"use client";

// Liste de classement générique (trophées ou Ranked all-time) avec un
// filtre par club — mêmes boutons de scope que /pusheurs
// (components/PusherLeaderboard.tsx), pour rester cohérent sur tout le
// site dès qu'un classement mélange plusieurs clubs.
import { useMemo, useState, ReactNode } from "react";
import Link from "next/link";
import RankTierIcon from "@/components/RankTierIcon";
import Podium from "@/components/Podium";
import { rankedTierIconPath } from "@/lib/rankedTier";
import PlayerAvatar from "@/components/PlayerAvatar";
import { PushGlyph } from "@/components/icons";

export interface ClassementEntry {
  tag: string;
  name: string;
  clubName: string;
  value: number;
  delta?: number;
  rankLabel?: string | null;
  iconUrl?: string | null;
}

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

const ROW = "grid grid-cols-[48px_minmax(0,1fr)_110px_156px] items-center gap-3.5 px-4 sm:px-6";

function ListHeader({ valueLabel, deltaLabel }: { valueLabel: string; deltaLabel: string }) {
  return (
    <div className={`${ROW} border-b border-paper/10 py-3.5 text-[10.5px] uppercase tracking-[0.14em] text-steel-600`}>
      <span>Rang</span>
      <span>Joueur</span>
      <span className="text-right">{deltaLabel}</span>
      <span className="text-right">{valueLabel}</span>
    </div>
  );
}

function Row({
  index,
  tag,
  name,
  sub,
  rankLabel,
  iconUrl,
  value,
  delta,
  last,
  valueIcon,
}: {
  index: number;
  tag: string;
  name: string;
  sub: string;
  rankLabel?: string | null;
  iconUrl?: string | null;
  value: number;
  delta?: number;
  last: boolean;
  valueIcon?: ReactNode;
}) {
  return (
    <Link
      href={`/joueurs/${encodeURIComponent(tag.replace(/^#/, ""))}`}
      className={`${ROW} py-3 no-underline transition hover:bg-panel2 ${
        last ? "" : "border-b border-paper/[0.07]"
      }`}
    >
      <span className="rank-index text-xs text-zest2">[{String(index + 1).padStart(2, "0")}]</span>
      <span className="flex min-w-0 items-center gap-3">
        <PlayerAvatar name={name} iconUrl={iconUrl} rankLabel={rankLabel} />
        <span className="min-w-0">
          <span className="block truncate text-sm text-paper">{name}</span>
          <span className="block truncate text-xs text-steel-400">{sub}</span>
        </span>
      </span>
      <span className="justify-self-end">
        {delta !== undefined && (
          <span
            className={`stat-mono flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[13.5px] ${
              delta >= 0
                ? "border border-signal/35 bg-signal/10 text-signal"
                : "border border-paper/15 text-blush"
            }`}
          >
            {delta >= 0 && <PushGlyph className="h-3 w-3" />}
            {delta >= 0 ? "+" : "−"}
            {formatNumber(Math.abs(delta))}
          </span>
        )}
      </span>
      <span className="flex items-center justify-end gap-1.5">
        {rankLabel ? (
          <RankTierIcon src={rankedTierIconPath(rankLabel)} label={rankLabel} className="h-10 w-10 shrink-0" />
        ) : (
          valueIcon
        )}
        <span className="stat-mono whitespace-nowrap text-right text-[18px] text-zest2">
          {formatNumber(value)}
        </span>
      </span>
    </Link>
  );
}

export default function ClassementBoard({
  entries,
  clubNames,
  valueLabel,
  deltaLabel = "",
  valueIcon,
  emptyMessage,
}: {
  entries: ClassementEntry[];
  clubNames: string[];
  valueLabel: string;
  deltaLabel?: string;
  valueIcon?: ReactNode;
  emptyMessage: string;
}) {
  const [scope, setScope] = useState("Tous les clubs");
  const scopes = ["Tous les clubs", ...clubNames];

  const filtered = useMemo(() => {
    const list = scope === "Tous les clubs" ? entries : entries.filter((e) => e.clubName === scope);
    return [...list].sort((a, b) => b.value - a.value);
  }, [entries, scope]);

  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-paper/10 bg-panel px-6 py-8 text-sm text-steel-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex w-fit flex-wrap gap-0.5 rounded-lg border border-paper/10 p-0.5">
        {scopes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={`rounded-md px-3.5 py-1.5 text-xs tracking-[0.1em] uppercase transition-colors ${
              scope === s ? "bg-zest/20 text-zest2" : "text-steel-500 hover:text-steel-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-paper/10 bg-panel px-6 py-8 text-sm text-steel-400">
          {emptyMessage}
        </p>
      ) : (
        <>
          <Podium
            valueIcon={valueIcon}
            entries={filtered.slice(0, 3).map((e) => ({
              tag: e.tag,
              name: e.name,
              clubName: e.clubName,
              value: e.value,
              delta: e.delta,
              rankLabel: e.rankLabel ?? undefined,
              iconUrl: e.iconUrl,
              rankIconSrc: e.rankLabel ? rankedTierIconPath(e.rankLabel) : null,
            }))}
          />
          <div className="overflow-hidden rounded-2xl border border-paper/10 bg-panel">
            <ListHeader valueLabel={valueLabel} deltaLabel={deltaLabel} />
            {filtered.map((e, i) => (
              <Row
                key={e.tag}
                index={i}
                tag={e.tag}
                name={e.name}
                sub={e.rankLabel ? `${e.clubName} · ${e.rankLabel}` : e.clubName}
                rankLabel={e.rankLabel}
                iconUrl={e.iconUrl}
                value={e.value}
                delta={e.delta}
                last={i === filtered.length - 1}
                valueIcon={valueIcon}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
