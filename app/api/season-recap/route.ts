import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getSeasonBaseline, listSeasonKeys } from "@/lib/kv";
import { computeSeasonPush } from "@/lib/seasonPush";
import { postSeasonRecapToDiscord } from "@/lib/discordWebhook";

export const dynamic = "force-dynamic";

// Renvoie à la main le classement final d'une saison close dans Discord
// (ex. /api/season-recap?season=2026-09). Réservé à l'admin connecté.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const discordId = (session?.user as { id?: string } | undefined)?.id;
  if (!isAdmin(discordId)) {
    return NextResponse.json({ error: "Non autorisé — connecte-toi avec ton compte admin" }, { status: 403 });
  }

  const season = request.nextUrl.searchParams.get("season");
  if (!season) {
    return NextResponse.json({ error: "Paramètre ?season=AAAA-MM requis" }, { status: 400 });
  }

  const keys = (await listSeasonKeys()).sort();
  const nextKey = keys[keys.indexOf(season) + 1];
  const [start, end] = await Promise.all([
    getSeasonBaseline(season),
    nextKey ? getSeasonBaseline(nextKey) : Promise.resolve(null),
  ]);
  if (!start || !end) {
    return NextResponse.json({ error: "Saison inconnue ou pas encore close" }, { status: 404 });
  }

  const result = await postSeasonRecapToDiscord(season, computeSeasonPush(start, end));
  return NextResponse.json({ season, ...result });
}
