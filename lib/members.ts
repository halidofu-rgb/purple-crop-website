// Liaison entre un compte Discord connecté et un joueur Brawl Stars.
//
// Le score Ranked que le joueur indique lui-même sert de "point zéro" :
// impossible de connaître un score Ranked absolu autrement (l'API ne le
// fournit pas — voir /support). Ensuite, on ajoute les gains/pertes réels
// des combats Ranked joués depuis cette saisie (via le battlelog) pour
// obtenir une estimation à jour, qui se corrige à chaque re-synchronisation
// manuelle.
import { getRedis } from "@/lib/redis";

export interface MemberLink {
  discordId: string;
  discordName: string;
  tag: string; // tag Brawl Stars, sans #
  rankedScore?: number; // dernière valeur indiquée par le joueur
  rankedUpdatedAt?: string; // ISO — pour ne compter que les combats après cette saisie
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
  const discordId = await redis.get(reverseKey(tag));
  if (!discordId) return null;
  return getMemberLink(discordId);
}

export async function saveMemberLink(link: MemberLink): Promise<void> {
  const redis = getRedis();
  await redis.set(linkKey(link.discordId), JSON.stringify(link));
  await redis.set(reverseKey(link.tag), link.discordId);
}
