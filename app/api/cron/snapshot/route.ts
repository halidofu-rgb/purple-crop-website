import { NextRequest, NextResponse } from "next/server";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline, setSeasonBaseline, BaselinePlayer } from "@/lib/kv";
import { recordTrophySnapshot, getTrophiesAtOrBefore } from "@/lib/trophyHistory";
import { getCurrentSeason } from "@/lib/season";

// Appelée automatiquement chaque jour par Vercel Cron (voir vercel.json).
// Enregistre aussi un point d'historique de trophées par joueur (voir
// lib/trophyHistory.ts, pour le graphique de progression sur /joueurs/[tag]).
//
// Pour la photo de saison :
// - Aucune photo pour la saison en cours → on en prend une. Comme le cron
//   tourne 1x/jour et que le vrai reset Brawl Stars a lieu à 9h UTC, il
//   peut arriver que la première capture du mois tombe APRÈS le reset —
//   dans ce cas les trophées "actuels" du joueur incluent déjà ses gains
//   du jour, et cette première journée de push disparaît silencieusement
//   (elle finit comptée dans le total de la saison PRÉCÉDENTE sur
//   /saisons, puisque cette même photo sert de point de clôture pour
//   l'ancienne saison). Pour éviter ça, on regarde d'abord si un point
//   d'historique quotidien existe daté d'avant le reset (le cron capture
//   toujours avant 9h UTC, donc un point du jour même ou d'avant convient)
//   et on l'utilise à la place des trophées du moment si c'est le cas.
// - Une photo existe déjà → on ne la remplace pas pour les membres déjà
//   suivis, SAUF si un point d'historique pré-reset plus bas existe (=
//   la toute première capture du mois avait raté la fenêtre pré-reset,
//   comme ci-dessus) : dans ce cas on corrige rétroactivement, ce qui
//   restaure la journée perdue. On ajoute aussi les membres qu'on n'avait
//   encore jamais vus cette saison (nouveaux arrivants).
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

  // Date butoir pour considérer un point d'historique "antérieur au
  // reset" de cette saison — voir le commentaire au-dessus.
  const cutoffDate = season.start.toISOString().slice(0, 10);

  async function preResetTrophies(tag: string, fallback: number): Promise<number> {
    const historical = await getTrophiesAtOrBefore(tag, cutoffDate).catch(() => null);
    return historical ?? fallback;
  }

  const existing = await getSeasonBaseline(season.key);

  if (!existing) {
    const baselinePlayers = await Promise.all(
      players.map(async (p) => ({ ...p, trophies: await preResetTrophies(p.tag, p.trophies) }))
    );
    await setSeasonBaseline({
      seasonKey: season.key,
      capturedAt: new Date().toISOString(),
      players: baselinePlayers,
    });
    return NextResponse.json({ ok: true, season: season.key, created: baselinePlayers.length });
  }

  // Corrige les entrées existantes si un point pré-reset plus bas est
  // apparu depuis (rattrape une première capture qui avait raté la
  // fenêtre pré-reset) — ne touche jamais à un membre sans historique
  // utilisable, et ne baisse jamais un point déjà correct.
  let correctedCount = 0;
  const correctedExisting = await Promise.all(
    existing.players.map(async (p) => {
      const historical = await getTrophiesAtOrBefore(p.tag, cutoffDate).catch(() => null);
      if (historical !== null && historical < p.trophies) {
        correctedCount++;
        return { ...p, trophies: historical };
      }
      return p;
    })
  );

  const known = new Set(correctedExisting.map((p) => p.tag));
  const newcomers = players.filter((p) => !known.has(p.tag));

  if (correctedCount > 0 || newcomers.length > 0) {
    await setSeasonBaseline({
      ...existing,
      players: [...correctedExisting, ...newcomers],
    });
  }

  return NextResponse.json({
    ok: true,
    season: season.key,
    corrected: correctedCount,
    added: newcomers.length,
    newcomers: newcomers.map((p) => p.name),
  });
}
