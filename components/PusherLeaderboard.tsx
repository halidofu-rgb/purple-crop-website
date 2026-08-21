"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import RankTierIcon from "@/components/RankTierIcon";
import { avatarColor } from "@/lib/avatarColor";

export interface PusherEntry {
  tag: string;
  name: string;
  clubName: string;
  role: string;
  trophies: number;
  delta: number;
  rankLabel: string | null;
  rankIconSrc: string | null;
}

type Sort = "push" | "trophies" | "ranked";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function PodiumCard({
  entry,
  place,
  lead,
}: {
  entry: PusherEntry;
  place: number;
  lead?: boolean;
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
        <span
          className={`relative h-12 w-12 shrink-0 rotate-45 rounded-[10px] ${
            lead
              ? "bg-gradient-to-br from-zest2 to-iris shadow-[0_0_26px_rgba(181,171,252,0.5)]"
              : "bg-gradient-to-br from-zest to-iris"
          }`}
        />
        <div className="min-w-0">
          <p className="truncate text-xl leading-tight tracking-[-0.01em] text-paper">
            {entry.name}
          </p>
          <p className="mt-0.5 text-xs text-steel-500">{entry.role}</p>
        </div>
      </div>
      <div className="relative mt-5 flex items-end justify-between border-t border-paper/10 pt-4">
        <div>
          <p className="stat-mono text-2xl leading-none tracking-[-0.02em] text-paper">
            {formatNumber(entry.trophies)}
          </p>
          <p className="mt-1 text-[10.5px] tracking-[0.14em] uppercase text-steel-500">
            trophées
          </p>
        </div>
        <p className={`stat-mono text-sm ${entry.delta >= 0 ? "text-signal" : "text-blush"}`}>
          {entry.delta >= 0 ? "+" : ""}
          {formatNumber(entry.delta)}
        </p>
      </div>
    </Link>
  );
}

export default function PusherLeaderboard({
  entries,
  clubNames,
}: {
  entries: PusherEntry[];
  clubNames: string[];
}) {
  const [scope, setScope] = useState<string>("Tous les clubs");
  const [sort, setSort] = useState<Sort>("push");
  const [search, setSearch] = useState("");

  const scopes = ["Tous les clubs", ...clubNames];

  const filtered = useMemo(() => {
    let list = entries;
    if (scope !== "Tous les clubs") list = list.filter((e) => e.clubName === scope);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sort === "trophies") return b.trophies - a.trophies;
      if (sort === "ranked") {
        const ra = a.rankLabel ? 1 : 0;
        const rb = b.rankLabel ? 1 : 0;
        if (ra !== rb) return rb - ra;
        return b.trophies - a.trophies;
      }
      return b.delta - a.delta;
    });
  }, [entries, scope, sort, search]);

  const podium = filtered.slice(0, 3);
  const rows = filtered.slice(3);
  const maxDelta = Math.max(...filtered.map((e) => e.delta), 1);

  const SORTS: { id: Sort; label: string }[] = [
    { id: "push", label: "Push" },
    { id: "trophies", label: "Trophées" },
    { id: "ranked", label: "Rang Ranked" },
  ];

  return (
    <div>
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {podium.map((entry, i) => (
          <PodiumCard key={entry.tag} entry={entry} place={i + 1} lead={i === 0} />
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
        <div className="flex gap-5 text-xs tracking-[0.1em] uppercase text-steel-600">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSort(s.id)}
              className={`pb-0.5 transition-colors ${
                sort === s.id ? "border-b border-zest2 text-paper" : "hover:text-steel-300"
              }`}
            >
              {s.label}
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
          Aucun joueur ne correspond à cette recherche.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-paper/10 bg-panel">
          <div className="hidden items-center gap-4 border-b border-paper/10 px-4 py-3 text-[10.5px] tracking-[0.14em] uppercase text-steel-600 sm:grid sm:grid-cols-[48px_minmax(0,1.4fr)_minmax(0,1fr)_92px_88px]">
            <span>Rang</span>
            <span>Joueur</span>
            <span>Push</span>
            <span className="text-right">Trophées</span>
            <span className="text-right">Ranked</span>
          </div>
          <ol className="divide-y divide-paper/[0.07]">
            {rows.map((entry, i) => (
              <li key={entry.tag}>
                <Link
                  href={`/joueurs/${encodeURIComponent(entry.tag.replace(/^#/, ""))}`}
                  className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-panel2 sm:grid sm:grid-cols-[48px_minmax(0,1.4fr)_minmax(0,1fr)_92px_88px]"
                >
                  <span className="stat-mono hidden text-lg text-steel-500 sm:block">
                    {String(i + 4).padStart(2, "0")}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none">
                    <span
                      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-ink"
                      style={{ backgroundColor: avatarColor(entry.name) }}
                    >
                      {entry.name.trim().charAt(0).toUpperCase()}
                      {entry.rankLabel && (
                        <RankTierIcon
                          src={entry.rankIconSrc}
                          label={entry.rankLabel}
                          className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border border-panel bg-panel2 p-0.5"
                        />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] text-paper">{entry.name}</span>
                      <span className="block truncate text-[11.5px] text-steel-500">
                        {entry.clubName}
                      </span>
                    </span>
                  </span>
                  <span className="hidden items-center gap-3 sm:flex">
                    <span className="h-[3px] flex-1 rounded-full bg-paper/10">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-iris to-zest2"
                        style={{
                          width: `${Math.round((Math.max(entry.delta, 0) / maxDelta) * 100)}%`,
                        }}
                      />
                    </span>
                    <span
                      className={`stat-mono shrink-0 text-xs whitespace-nowrap ${entry.delta >= 0 ? "text-zest2" : "text-blush"}`}
                    >
                      {entry.delta >= 0 ? "+" : ""}
                      {formatNumber(entry.delta)}
                    </span>
                  </span>
                  <span className="stat-mono shrink-0 text-right text-[15px] whitespace-nowrap text-paper sm:block">
                    {formatNumber(entry.trophies)}
                  </span>
                  <span className="hidden truncate text-right text-[11px] tracking-[0.1em] uppercase text-steel-600 sm:block">
                    {entry.rankLabel ?? "—"}
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
