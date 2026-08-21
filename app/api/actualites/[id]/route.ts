import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { deleteNewsPost } from "@/lib/news";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const discordId = (session?.user as { id?: string } | undefined)?.id;
  if (!isAdmin(discordId)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  await deleteNewsPost(params.id);
  return NextResponse.json({ ok: true });
}
