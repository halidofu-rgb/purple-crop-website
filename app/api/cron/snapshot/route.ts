import { NextRequest, NextResponse } from "next/server";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline, setSeasonBaseline, BaselinePlayer } from "@/lib/kv";
import { recordTrophySnapshot } from "@/lib/trophyHistory";
import { getCurrentSeason } from "@/lib/season";

// Appelée automatiquement chaque jour par Vercel Cron (voir vercel.json).
// Enregistre aussi un point d'historique de trophées par joueur (voir
// lib/trophyHistory.ts, pour le graphique de progression sur /joueurs/[tag]).
// Pour la photo de saison, deux cas :
// - Aucune photo pour la saison en cours → on en prend une complète, elle
//   sert de point de départ ("0") pour calculer le push de chacun.
// - Une photo existe déjà → on ne la remplace pas (les membres déjà suivis
//   gardent leur point de départ initial), mais on ajoute les membres
//   qu'on n'avait encore jamais vus cette saison — typiquement un nouveau
//   membre qui vient de rejoindre un club. Leur push démarre alors à 0 à
//   partir d'ici (leurs trophées actuels), au lieu d'attendre la saison
//   suivante pour être suivis.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const season = getCurrentSeason();
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

  // Historique jour par jour (fiche joueur) — indépendant de la logique de
  // photo de saison ci-dessous, alimenté avec les mêmes données déjà
  // récupérées, sans appel API supplémentaire.
  const today = new Date().toISOString().slice(0, 10);
  await Promise.all(
    players.map((p) =>
      recordTrophySnapshot(p.tag, p.trophies, today).catch((err) =>
        console.error(`Historique trophées : échec pour ${p.tag}`, err)
      )
    )
  );

  const existing = await getSeasonBaseline(season.key);

  if (!existing) {
    await setSeasonBaseline({
      seasonKey: season.key,
      capturedAt: new Date().toISOString(),
      players,
    });
    return NextResponse.json({ ok: true, season: season.key, created: players.length });
  }

  const known = new Set(existing.players.map((p) => p.tag));
  const newcomers = players.filter((p) => !known.has(p.tag));

  if (newcomers.length > 0) {
    await setSeasonBaseline({
      ...existing,
      players: [...existing.players, ...newcomers],
    });
  }

  return NextResponse.json({
    ok: true,
    season: season.key,
    added: newcomers.length,
    newcomers: newcomers.map((p) => p.name),
  });
}
