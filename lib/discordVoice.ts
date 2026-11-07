// Temps passé en vocal sur le Discord, mesuré par échantillonnage.
//
// Discord ne garde aucun historique de présence en vocal, et DraftBot ne
// donne l'XP vocale qu'en Premium. On interroge donc régulièrement l'API REST
// (GET /guilds/{id}/voice-states/{user}) pour chaque membre : s'il est
// connecté à un salon vocal à cet instant (même en sourdine ou AFK), on lui
// crédite le temps écoulé depuis le dernier passage. Le cumul est stocké par
// saison dans Redis (voir /activite).
//
// Aucune connexion permanente : un passage (route /api/cron/voice) toutes les
// ~10 minutes suffit. Le bot a seulement besoin des permissions « Voir les
// salons » et « Se connecter » sur les salons vocaux.
import { getRedis } from "@/lib/redis";

const API = "https://discord.com/api/v10";
export const VOICE_GUILD_ID =
  process.env.DISCORD_GUILD_ID || process.env.DRAFTBOT_GUILD_ID || "1424376123411796038";

const MIN_CREDIT_SECONDS = 60;
const MAX_CREDIT_SECONDS = 15 * 60; // un trou (site endormi...) ne crédite jamais plus de 15 min
const DEFAULT_CREDIT_SECONDS = 10 * 60;
const CONCURRENCY = 6;

const seasonKey = (season: string) => `purplecorp:voice:season:${season}`;
const NAMES_KEY = "purplecorp:voice:names";
const LAST_RUN_KEY = "purplecorp:voice:last";

class DiscordAuthError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function botFetch(path: string, attempt = 0): Promise<Response> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new DiscordAuthError("DISCORD_BOT_TOKEN manquant");
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bot ${token}`,
      "User-Agent": "PurpleCorpBot (purple-corp.onrender.com, 1.0)",
    },
    cache: "no-store",
  });
  if (res.status === 429 && attempt < 2) {
    const body = (await res.json().catch(() => ({}))) as { retry_after?: number };
    await sleep(Math.min(5000, Math.ceil((body.retry_after ?? 1) * 1000)));
    return botFetch(path, attempt + 1);
  }
  if (res.status === 401) throw new DiscordAuthError("Token du bot refusé par Discord (401)");
  return res;
}

export interface GuildMember {
  id: string;
  name: string;
}

// Liste des membres du serveur — demande l'option « Server Members Intent »
// dans le portail développeur. Renvoie null si elle n'est pas activée (le
// suivi se rabat alors sur les comptes connus : classement DraftBot + liés).
export async function listGuildMembers(): Promise<GuildMember[] | null> {
  const out: GuildMember[] = [];
  let after = "0";
  for (let page = 0; page < 20; page++) {
    const res = await botFetch(`/guilds/${VOICE_GUILD_ID}/members?limit=1000&after=${after}`);
    if (!res.ok) return null;
    const batch = (await res.json()) as {
      user: { id: string; username: string; global_name?: string | null; bot?: boolean };
      nick?: string | null;
    }[];
    for (const m of batch) {
      if (m.user.bot) continue;
      out.push({ id: m.user.id, name: m.nick || m.user.global_name || m.user.username });
    }
    if (batch.length < 1000) break;
    after = batch[batch.length - 1].user.id;
  }
  return out;
}

// true = connecté à un salon vocal, false = non (Discord répond 404),
// null = on ne sait pas (ex. salon que le bot n'a pas le droit de voir).
async function isInVoice(userId: string): Promise<boolean | null> {
  const res = await botFetch(`/guilds/${VOICE_GUILD_ID}/voice-states/${userId}`);
  if (res.status === 404) return false;
  if (!res.ok) return null;
  const state = (await res.json()) as { channel_id?: string | null };
  return !!state.channel_id;
}

export interface VoiceSweepResult {
  polled: number;
  inVoice: number;
  errors: number;
  creditedSeconds: number;
}

export async function runVoiceSweep(
  season: string,
  members: GuildMember[]
): Promise<VoiceSweepResult> {
  const redis = getRedis();
  const now = Date.now();
  const lastRaw = await redis.get(LAST_RUN_KEY);
  const credit = lastRaw
    ? Math.min(MAX_CREDIT_SECONDS, Math.max(MIN_CREDIT_SECONDS, Math.round((now - Number(lastRaw)) / 1000)))
    : DEFAULT_CREDIT_SECONDS;

  const queue = [...members];
  const present: string[] = [];
  let errors = 0;

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (;;) {
        const m = queue.pop();
        if (!m) return;
        const inVoice = await isInVoice(m.id);
        if (inVoice === null) errors += 1;
        else if (inVoice) present.push(m.id);
      }
    })
  );

  if (present.length > 0) {
    const pipeline = redis.pipeline();
    for (const id of present) pipeline.hincrby(seasonKey(season), id, credit);
    await pipeline.exec();
  }
  await redis.set(LAST_RUN_KEY, String(now));

  return { polled: members.length, inVoice: present.length, errors, creditedSeconds: credit };
}

export async function saveVoiceNames(members: GuildMember[]): Promise<void> {
  if (members.length === 0) return;
  const fields: Record<string, string> = {};
  for (const m of members) fields[m.id] = m.name;
  await getRedis().hset(NAMES_KEY, fields);
}

/** Secondes passées en vocal sur la saison, par id Discord. */
export async function getVoiceSeconds(season: string): Promise<Record<string, number>> {
  const raw = await getRedis().hgetall(seasonKey(season));
  return Object.fromEntries(Object.entries(raw).map(([id, v]) => [id, Number(v)]));
}

export async function getVoiceNames(): Promise<Record<string, string>> {
  return getRedis().hgetall(NAMES_KEY);
}
