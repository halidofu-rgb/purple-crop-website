// Liaison entre un compte Discord connecté et un joueur Brawl Stars — sert
// uniquement à retrouver la fiche joueur et la bio depuis une session
// Discord. Le Ranked (rang, Elo, record) n'est pas stocké ici : il vient en
// direct de l'API à chaque affichage (lib/rankedLive.ts, lib/brawlstars.ts).
import { getRedis } from "@/lib/redis";

export interface MemberLink {
  discordId: string;
  discordName: string;
  tag: string; // tag Brawl Stars, sans #
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

export async function listAllMemberLinks(): Promise<MemberLink[]> {
  const redis = getRedis();
  const keys = await redis.keys("purplecorp:member:*");
  if (keys.length === 0) return [];
  const raw = await redis.mget(...keys);
  return raw.filter((r): r is string => r !== null).map((r) => JSON.parse(r) as MemberLink);
}
