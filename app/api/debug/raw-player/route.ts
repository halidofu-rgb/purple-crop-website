import { NextRequest, NextResponse } from "next/server";

// Route de diagnostic TEMPORAIRE : affiche la réponse brute et complète de
// l'API Brawl Stars (via notre proxy RoyaleAPI), sans passer par notre
// typage TypeScript qui ne lit que les champs qu'on lui a explicitement
// demandés. Sert à vérifier une fois pour toutes si l'API renvoie des
// champs Ranked qu'on n'aurait pas remarqués. À supprimer une fois la
// question tranchée.
export async function GET(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get("tag");
  if (!tag) {
    return NextResponse.json({ error: "Ajoute ?tag=TONTAG à l'URL" }, { status: 400 });
  }

  const clean = tag.trim().toUpperCase().replace(/^#/, "");
  const apiKey = process.env.BRAWL_STARS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "BRAWL_STARS_API_KEY manquante" }, { status: 500 });
  }

  const res = await fetch(`https://bsproxy.royaleapi.dev/v1/players/%23${clean}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    cache: "no-store",
  });

  const raw = await res.text();
  return new NextResponse(raw, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
