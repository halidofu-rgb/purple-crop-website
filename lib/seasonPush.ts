// Calcul du push d'une saison CLOSE : compare sa photo de départ à celle
// de la saison suivante (= son propre point final). Partagé entre
// /saisons (résumé de chaque saison) et /saisons/[key] (détail complet).
import { SeasonBaseline } from "@/lib/kv";

export interface SeasonPushRow {
  tag: string;
  name: string;
  clubName: string;
  delta: number;
}

export function computeSeasonPush(start: SeasonBaseline, end: SeasonBaseline): SeasonPushRow[] {
  const endByTag = new Map(end.players.map((p) => [p.tag, p]));
  const rows: SeasonPushRow[] = [];

  for (const p of start.players) {
    const after = endByTag.get(p.tag);
    if (!after) continue; // parti avant la fin de la saison, pas de point final
    rows.push({ tag: p.tag, name: p.name, clubName: p.clubName, delta: after.trophies - p.trophies });
  }

  return rows.sort((a, b) => b.delta - a.delta);
}
