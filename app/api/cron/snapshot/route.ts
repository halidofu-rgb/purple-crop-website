import { NextRequest, NextResponse } from "next/server";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { pushSnapshot, SnapshotPlayer } from "@/lib/kv";

// Cette route est appelée automatiquement une fois par jour par Vercel Cron
// (voir vercel.json). Elle prend une "photo" des trophées de tout le monde
// et l'ajoute à l'historique dans Redis. C'est cette photo, comparée à celle
// d'hier, qui permet de calculer qui a "pushé" sur la page /pusheurs.
export async function GET(request: NextRequest) {
  // Vercel ajoute automatiquement ce header quand CRON_SECRET est configuré
  // en variable d'environnement : ça évite que n'importe qui déclenche la
  // capture en visitant simplement l'URL.
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const tags = clubTags();
  const players: SnapshotPlayer[] = [];

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

  await pushSnapshot({ date: new Date().toISOString(), players });

  return NextResponse.json({ ok: true, players: players.length });
}
