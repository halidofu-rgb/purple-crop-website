"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import RankTierIcon from "@/components/RankTierIcon";
import { TrophyGlyph } from "@/components/icons";
import { avatarColor } from "@/lib/avatarColor";

export interface PusherEntry {
  tag: string;
  name: string;
  clubName: string;
  role: string;
  value: number; // push de trophées (peut être négatif) OU Elo Ranked actuel
  rankLabel: string | null;
  rankIconSrc: string | null;
}

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function Avatar({ name, rankLabel, rankIconSrc }: { name: string; rankLabel: string | null; rankIconSrc: string | null }) {
  return (
    <span
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-ink"
      style={{ backgroundColor: avatarColor(name) }}
    >
      {name.trim().charAt(0).toUpperCase()}
      {rankLabel && (
        <RankTierIcon
          src={rankIconSrc}
          label={rankLabel}
          className="absolute -bottom-1.5 -right-1.5 h-5 w-5 rounded-full border-2 border-panel bg-panel2 p-0.5 shadow-[0_0_8px_rgba(0,0,0,0.35)]"
        />
      )}
    </span>
  );
}

function PodiumCard({
  entry,
  place,
  lead,
  mode,
}: {
  entry: PusherEntry;
  place: number;
  lead?: boolean;
  mode: "push" | "ranked";
}) {
  return (
    <Link
      href={`/joueurs/${encodeURIComponent(entry.tag.replace(/^#/, ""))}`}
      className={`relative block overflow-hidden rounded-2xl px-6 py-6 transition ${
        lead
          ? "border border-zest2/40 bg-gradient-to-br from-iris/70 to-panel/85 hover:border-zest2/60"
          : "border border-paper/15 bg-gradient-to-br from-panel/95 to-ink/70 hover:border-paper/30"
      }`}
    >
      {lead && (
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(181,171,252,0.28),transparent_65%)]" />
      )}
      <div className="relative mb-5 flex items-center justify-between">
        <span
          className={`stat-mono text-4xl leading-none tracking-[-0.03em] ${
            lead ? "text-zest2 [text-shadow:0_0_30px_rgba(181,171,252,0.5)]" : "text-steel-500"
          }`}
        >
          {String(place).padStart(2, "0")}
        </span>
        <span
          className={`rounded-md px-2.5 py-1 text-[10.5px] tracking-[0.14em] uppercase ${
            lead
              ? "border border-zest2/40 bg-iris/60 text-zest2"
              : "border border-paper/15 text-steel-400"
          }`}
        >
          {entry.clubName}
        </span>
      </div>
      <div className="relative flex items-center gap-4">
        <Avatar name={entry.name} rankLabel={mode === "ranked" ? entry.rankLabel : null} rankIconSrc={entry.rankIconSrc} />
        <div className="min-w-0">
          <p className="truncate text-xl leading-tight tracking-[-0.01em] text-paper">
            {entry.name}
          </p>
          <p className="mt-0.5 text-xs text-steel-500">{entry.role}</p>
        </div>
      </div>
      <div className="relative mt-5 border-t border-paper/10 pt-4">
        {mode === "push" ? (
          <>
            <p
              className={`stat-mono flex items-center gap-1.5 text-3xl leading-none tracking-[-0.02em] ${
                entry.value >= 0 ? "text-signal" : "text-blush"
              }`}
            >
              <TrophyGlyph className="h-6 w-6" />
              {entry.value >= 0 ? "+" : ""}
              {formatNumber(entry.value)}
            </p>
            <p className="mt-1 text-[10.5px] tracking-[0.14em] uppercase text-steel-500">
              trophées gagnés cette saison
            </p>
          </>
        ) : (
          <>
            <p className="flex items-center gap-2">
              {entry.rankLabel && (
                <RankTierIcon src={entry.rankIconSrc} label={entry.rankLabel} className="h-8 w-8 shrink-0" />
              )}
              <span className="stat-mono text-3xl leading-none tracking-[-0.02em] text-signal">
                {formatNumber(entry.value)}
              </span>
            </p>
            <p className="mt-1 text-[10.5px] tracking-[0.14em] uppercase text-steel-500">
              {entry.rankLabel ?? "Elo"} — cette saison
            </p>
          </>
        )}
      </div>
    </Link>
  );
}

export default function PusherLeaderboard({
  entries,
  clubNames,
  mode,
}: {
  entries: PusherEntry[];
  clubNames: string[];
  mode: "push" | "ranked";
}) {
  const [scope, setScope] = useState<string>("Tous les clubs");
  const [search, setSearch] = useState("");

  const scopes = ["Tous les clubs", ...clubNames];

  const filtered = useMemo(() => {
    let list = entries;
    if (scope !== "Tous les clubs") list = list.filter((e) => e.clubName === scope);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => b.value - a.value);
  }, [entries, scope, search]);

  const podium = filtered.slice(0, 3);
  const rows = filtered.slice(3);
  const maxValue = Math.max(...filtered.map((e) => e.value), 1);

  const valueColumnLabel = mode === "push" ? "Push cette saison" : "Elo Ranked cette saison";
  const emptyMessage =
    mode === "push"
      ? "Aucun joueur ne correspond à cette recherche."
      : "Aucun joueur avec un rang Ranked ne correspond à cette recherche.";

  return (
    <div>
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {podium.map((entry, i) => (
          <PodiumCard key={entry.tag} entry={entry} place={i + 1} lead={i === 0} mode={mode} />
        ))}
      </div>

      {/* filtres */}
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-2xl border border-paper/10 bg-panel/50 px-5 py-4">
        <div className="flex flex-wrap gap-0.5 rounded-lg border border-paper/10 p-0.5">
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
        <label className="ml-auto flex min-w-[200px] flex-1 items-center gap-2.5 rounded-lg border border-paper/10 px-3.5 py-2 focus-within:border-zest sm:flex-none">
          <span className="h-3 w-3 shrink-0 rounded-full border border-steel-600" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un joueur"
            className="w-full bg-transparent text-[12.5px] text-paper outline-none placeholder:text-steel-600"
          />
        </label>
      </div>

      {/* table */}
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-paper/10 bg-panel px-4 py-6 text-center text-sm text-steel-400">
          {emptyMessage}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-paper/10 bg-panel">
          <div className="hidden items-center gap-4 border-b border-paper/10 px-4 py-3 text-[10.5px] tracking-[0.14em] uppercase text-steel-600 sm:grid sm:grid-cols-[48px_minmax(0,1fr)_200px]">
            <span>Rang</span>
            <span>Joueur</span>
            <span className="text-right">{valueColumnLabel}</span>
          </div>
          <ol className="divide-y divide-paper/[0.07]">
            {rows.map((entry, i) => (
              <li key={entry.tag}>
                <Link
                  href={`/joueurs/${encodeURIComponent(entry.tag.replace(/^#/, ""))}`}
                  className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-panel2 sm:grid sm:grid-cols-[48px_minmax(0,1fr)_200px]"
                >
                  <span className="stat-mono hidden text-lg text-steel-500 sm:block">
                    {String(i + 4).padStart(2, "0")}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none">
                    <Avatar name={entry.name} rankLabel={entry.rankLabel} rankIconSrc={entry.rankIconSrc} />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] text-paper">{entry.name}</span>
                      <span className="block truncate text-[11.5px] text-steel-500">
                        {mode === "ranked" && entry.rankLabel
                          ? `${entry.clubName} · ${entry.rankLabel}`
                          : entry.clubName}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="hidden h-[3px] flex-1 rounded-full bg-paper/10 sm:block">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-iris to-zest2"
                        style={{
                          width: `${Math.round((Math.max(entry.value, 0) / maxValue) * 100)}%`,
                        }}
                      />
                    </span>
                    {mode === "ranked" && entry.rankLabel && (
                      <RankTierIcon
                        src={entry.rankIconSrc}
                        label={entry.rankLabel}
                        className="h-6 w-6 shrink-0"
                      />
                    )}
                    <span
                      className={`stat-mono flex shrink-0 items-center gap-1 text-[15px] whitespace-nowrap ${
                        mode === "push"
                          ? entry.value >= 0
                            ? "text-zest2"
                            : "text-blush"
                          : "text-zest2"
                      }`}
                    >
                      {mode === "push" && <TrophyGlyph className="h-3.5 w-3.5" />}
                      {mode === "push" && entry.value >= 0 ? "+" : ""}
                      {formatNumber(entry.value)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="mt-4 text-[12.5px] text-steel-600">
        {filtered.length} joueur{filtered.length > 1 ? "s" : ""} affiché
        {filtered.length > 1 ? "s" : ""} sur {entries.length}
      </p>
    </div>
  );
}
