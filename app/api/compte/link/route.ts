import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPlayer } from "@/lib/brawlstars";
import { saveMemberLink } from "@/lib/members";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const discordId = (session?.user as { id?: string } | undefined)?.id;
  if (!session || !discordId) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const body = await request.json();
  const tag = String(body.tag ?? "").trim().toUpperCase().replace(/^#/, "");
  const rankedScoreRaw = body.rankedScore;

  if (!tag) {
    return NextResponse.json({ error: "Tag manquant" }, { status: 400 });
  }

  // On vérifie que le tag existe vraiment avant de l'enregistrer — on ne
  // fait jamais confiance à une saisie non vérifiée.
  try {
    await getPlayer(tag);
  } catch {
    return NextResponse.json(
      { error: "Ce tag Brawl Stars est introuvable. Vérifie l'orthographe (avec ou sans #)." },
      { status: 400 }
    );
  }

  const rankedScore =
    rankedScoreRaw !== undefined && rankedScoreRaw !== "" && !Number.isNaN(Number(rankedScoreRaw))
      ? Number(rankedScoreRaw)
      : undefined;

  await saveMemberLink({
    discordId,
    discordName: session.user?.name ?? "Membre",
    tag,
    rankedScore,
    rankedUpdatedAt: rankedScore !== undefined ? new Date().toISOString() : undefined,
  });

  return NextResponse.json({ ok: true });
}
