import { NextRequest, NextResponse } from "next/server";
import { getCurrentSeason } from "@/lib/season";
import { fetchAllDiscordLevels } from "@/lib/draftbotLevels";
import { listAllMemberLinks } from "@/lib/members";
import {
  GuildMember,
  listGuildMembers,
  runVoiceSweep,
  saveVoiceNames,
} from "@/lib/discordVoice";

// Appelée toutes les ~10 minutes par un déclencheur externe (cron-job.org) :
// regarde qui est connecté en vocal et lui crédite le temps écoulé (voir
// lib/discordVoice.ts). Même protection que /api/cron/snapshot.
//
// Le relevé interroge chaque membre du serveur (plusieurs centaines d'appels) :
// il peut dépasser les 30 s de délai de cron-job.org. Par défaut on répond donc
// tout de suite et le relevé se termine en arrière-plan (le serveur Render est
// un processus continu). Avec ?wait=1, on attend la fin et on renvoie le détail
// — utile pour tester.
export const dynamic = "force-dynamic";

let running = false;

async function sweep() {
  // Qui interroger : tout le serveur si l'option « Server Members Intent »
  // est activée, sinon les comptes connus (classement DraftBot + liés au site).
  let members = await listGuildMembers();
  const source = members ? "serveur" : "comptes connus";
  if (members) {
    await saveVoiceNames(members);
  } else {
    const known = new Map<string, GuildMember>();
    const levels = await fetchAllDiscordLevels().catch(() => ({}));
    for (const [id, l] of Object.entries(levels)) known.set(id, { id, name: l.name });
    const links = await listAllMemberLinks().catch(() => []);
    for (const l of links) {
      if (!known.has(l.discordId)) known.set(l.discordId, { id: l.discordId, name: l.discordName });
    }
    members = [...known.values()];
  }

  const result = await runVoiceSweep(getCurrentSeason().key, members);
  console.log("Suivi vocal :", source, JSON.stringify(result));
  return { ok: true, source, ...result };
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!process.env.DISCORD_BOT_TOKEN) {
    return NextResponse.json({ ok: false, error: "DISCORD_BOT_TOKEN manquant" });
  }
  if (running) {
    return NextResponse.json({ ok: true, skipped: "relevé précédent encore en cours" });
  }

  const wait = request.nextUrl.searchParams.get("wait") === "1";
  running = true;

  if (wait) {
    try {
      return NextResponse.json(await sweep());
    } catch (err) {
      console.error("Suivi vocal : échec", err);
      return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
    } finally {
      running = false;
    }
  }

  void sweep()
    .catch((err) => console.error("Suivi vocal : échec", err))
    .finally(() => {
      running = false;
    });
  return NextResponse.json({ ok: true, started: true });
}
