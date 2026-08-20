import { NextResponse } from "next/server";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";

export interface SearchEntry {
  type: "player" | "club";
  tag: string;
  name: string;
  subtitle?: string;
}

// Petit index de recherche : tous les clubs + tous leurs membres. L'API
// Brawl Stars ne permet pas de chercher un joueur par nom, seulement par
// tag exact — donc on construit cet index nous-mêmes, à partir de ce
// qu'on a déjà (l'effectif de nos propres clubs).
export async function GET() {
  const tags = clubTags();
  const entries: SearchEntry[] = [];

  for (const tag of tags) {
    try {
      const club = await getClub(tag);
      entries.push({ type: "club", tag: club.tag, name: club.name, subtitle: `${club.members.length} membres` });
      for (const m of club.members) {
        entries.push({ type: "player", tag: m.tag, name: m.name, subtitle: club.name });
      }
    } catch {
      // club indisponible, on l'ignore silencieusement pour la recherche
    }
  }

  return NextResponse.json({ entries });
}
