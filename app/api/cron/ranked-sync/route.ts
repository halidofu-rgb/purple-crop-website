import { NextRequest, NextResponse } from "next/server";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { syncRankedTracking } from "@/lib/rankedTracking";

// Synchronise le suivi Ranked de TOUS les membres de Purple Corp. Appelée
// par le cron Vercel (1x/jour, voir vercel.json). Pour un suivi plus fin
// (comme Projet X, qui semble sonder bien plus souvent), on peut aussi
// déclencher cette route via un service externe gratuit (cron-job.org)
// toutes les 15-30 min — voir le README.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const tags = clubTags();
  let synced = 0;
  let failed = 0;

  for (const tag of tags) {
    try {
      const club = await getClub(tag);
      for (const member of club.members) {
        try {
          await syncRankedTracking(member.tag, member.name, club.name);
          synced++;
        } catch (err) {
          console.error(`Ranked sync échec pour ${member.tag}`, err);
          failed++;
        }
      }
    } catch (err) {
      console.error(`Ranked sync échec pour le club ${tag}`, err);
    }
  }

  return NextResponse.json({ ok: true, synced, failed });
}
