// Liaison entre un compte Discord connecté et un joueur Brawl Stars.
//
// rankedScore et rankedBest sont AUTO-DÉCLARÉS par le joueur lui-même —
// impossible de les récupérer via l'API Brawl Stars, qui ne fournit aucun
// score Ranked absolu (voir /support). On les affiche tels quels, sans
// tenter de deviner ou recalculer quoi que ce soit.
import { getRedis } from "@/lib/redis";

export interface MemberLink {
  discordId: string;
  discordName: string;
  tag: string; // tag Brawl Stars, sans #
  rankedScore?: number; // score Ranked actuel, déclaré par le joueur
  rankedBest?: number; // meilleur score Ranked all-time, déclaré par le joueur
  rankedUpdatedAt?: string; // ISO — date de la dernière saisie
  bio?: string; // petite présentation libre, écrite par le joueur lui-même
}

function linkKey(discordId: string): string {
  return `purplecorp:member:${discordId}`;
}
function reverseKey(tag: string): string {
  return `purplecorp:member-by-tag:${tag.toUpperCase()}`;
}

export async function getMemberLink(discordId: string): Promise<MemberLink | null> {
  const redis = getRedis();
  const raw = await redis.get(linkKey(discordId));
  return raw ? (JSON.parse(raw) as MemberLink) : null;
}

export async function getMemberLinkByTag(tag: string): Promise<MemberLink | null> {
  const redis = getRedis();
  const discordId = await redis.get(reverseKey(tag.toUpperCase().replace(/^#/, "")));
  if (!discordId) return null;
  return getMemberLink(discordId);
}

export async function saveMemberLink(link: MemberLink): Promise<void> {
  const redis = getRedis();
  await redis.set(linkKey(link.discordId), JSON.stringify(link));
  await redis.set(reverseKey(link.tag), link.discordId);
}

// Liste tous les membres liés — sert au classement Ranked (auto-déclaré).
export async function listAllMemberLinks(): Promise<MemberLink[]> {
  const redis = getRedis();
  const keys = await redis.keys("purplecorp:member:*");
  if (keys.length === 0) return [];
  const raw = await redis.mget(...keys);
  return raw.filter((r): r is string => r !== null).map((r) => JSON.parse(r) as MemberLink);
}
