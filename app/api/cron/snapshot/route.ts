import { NextRequest, NextResponse } from "next/server";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline, setSeasonBaseline, BaselinePlayer } from "@/lib/kv";
import { getCurrentSeason } from "@/lib/season";

// Appelée automatiquement chaque jour par Vercel Cron (voir vercel.json).
// Elle ne fait qu'une chose : si aucune photo n'existe encore pour la
// saison en cours, elle en prend une — c'est cette photo qui sert de
// point de départ ("0") pour calculer le push de chacun sur /pusheurs.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const season = getCurrentSeason();
  const existing = await getSeasonBaseline(season.key);
  if (existing) {
    return NextResponse.json({ ok: true, skipped: true, season: season.key });
  }

  const tags = clubTags();
  const players: BaselinePlayer[] = [];

  for (const tag of tags) {
    try {
      const club = await getClub(tag);
      for (const member of club.members) {
        players.push({
          tag: member.tag,
          name: member.name,
          trophies: member.trophies,
          clubName: club.name,
        });
      }
    } catch (err) {
      console.error(`Snapshot: échec pour le club ${tag}`, err);
    }
  }

  await setSeasonBaseline({
    seasonKey: season.key,
    capturedAt: new Date().toISOString(),
    players,
  });

  return NextResponse.json({ ok: true, season: season.key, players: players.length });
}
