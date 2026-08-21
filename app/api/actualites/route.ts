import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createNewsPost } from "@/lib/news";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const discordId = (session?.user as { id?: string } | undefined)?.id;
  if (!isAdmin(discordId)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await request.json();
  const title = String(body.title ?? "").trim().slice(0, 120);
  const text = String(body.body ?? "").trim().slice(0, 4000);
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim().slice(0, 500) : "";

  if (!title || !text) {
    return NextResponse.json({ error: "Titre et texte requis" }, { status: 400 });
  }

  const post = await createNewsPost({
    title,
    body: text,
    imageUrl: imageUrl || undefined,
  });

  return NextResponse.json({ ok: true, post });
}
