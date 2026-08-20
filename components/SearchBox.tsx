"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import type { SearchEntry } from "@/app/api/search/route";

export default function SearchBox() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && entries === null) {
      fetch("/api/search")
        .then((r) => r.json())
        .then((data) => setEntries(data.entries ?? []))
        .catch(() => setEntries([]));
    }
  }, [open, entries]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const results = (entries ?? []).filter(
    (e) => query.trim().length > 0 && e.name.toLowerCase().includes(query.trim().toLowerCase())
  ).slice(0, 8);

  function goTo(entry: SearchEntry) {
    const cleanTag = entry.tag.replace(/^#/, "");
    router.push(entry.type === "player" ? `/joueurs/${cleanTag}` : `/clubs/${cleanTag}`);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative">
      {open ? (
        <div className="flex items-center gap-2 rounded-full border border-line bg-panel2 px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-ash" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Joueur ou club..."
            className="w-32 bg-transparent text-xs text-white placeholder:text-ash focus:outline-none sm:w-44"
          />
          <button onClick={() => setOpen(false)} aria-label="Fermer">
            <X className="h-3.5 w-3.5 text-ash hover:text-white" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Rechercher"
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-ash transition hover:bg-panel2/60 hover:text-white"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      )}

      {open && query.trim().length > 0 && (
        <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
          {entries === null ? (
            <p className="px-4 py-3 text-xs text-ash">Chargement...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-xs text-ash">Aucun résultat pour &quot;{query}&quot;.</p>
          ) : (
            <ul className="divide-y divide-line">
              {results.map((r) => (
                <li key={`${r.type}-${r.tag}`}>
                  <button
                    onClick={() => goTo(r)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left transition hover:bg-panel2"
                  >
                    <span className="truncate font-display text-xs font-medium text-white">
                      {r.name}
                    </span>
                    <span className="ml-2 shrink-0 text-[10px] uppercase tracking-wide text-ash">
                      {r.subtitle}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
