// Actualités du club / Brawl Stars, publiées à la main depuis /actualites.
// Une entrée par clé Redis (même principe que lib/members.ts) — pas besoin
// d'index séparé pour ce volume, on liste par pattern de clé.
import { getRedis } from "@/lib/redis";

export interface NewsPost {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  createdAt: string; // ISO
}

function key(id: string): string {
  return `purplecorp:news:${id}`;
}

export async function listNews(): Promise<NewsPost[]> {
  const redis = getRedis();
  const keys = await redis.keys("purplecorp:news:*");
  if (keys.length === 0) return [];
  const raw = await redis.mget(...keys);
  return raw
    .filter((r): r is string => r !== null)
    .map((r) => JSON.parse(r) as NewsPost)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createNewsPost(input: {
  title: string;
  body: string;
  imageUrl?: string;
}): Promise<NewsPost> {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const post: NewsPost = { id, createdAt: new Date().toISOString(), ...input };
  const redis = getRedis();
  await redis.set(key(id), JSON.stringify(post));
  return post;
}

export async function deleteNewsPost(id: string): Promise<void> {
  const redis = getRedis();
  await redis.del(key(id));
}
