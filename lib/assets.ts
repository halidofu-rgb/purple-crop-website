// Vraies icônes Brawl Stars (profil joueur, badge de club), servies par
// BrawlAPI/Brawlify — un CDN public conçu explicitement pour être utilisé
// par des sites tiers ("pair perfectly with BrawlAPI data"), sous la Fan
// Content Policy de Supercell (supercell.com/fan-content-policy).
//
// PAS de vraies icônes de rang Ranked ici : aucune source publique de ce
// type n'existe (Brawl Time Ninja utilise ses propres images maison, pas
// une API ouverte — voir /support pour l'explication complète).

interface IconEntry {
  id: number;
  imageUrl: string;
}

interface IconsResponse {
  player: Record<string, IconEntry>;
  club: Record<string, IconEntry>;
}

let cache: IconsResponse | null = null;
let cacheAt = 0;
const CACHE_MS = 60 * 60 * 1000; // 1h — ce sont des assets quasi statiques

async function getIcons(): Promise<IconsResponse | null> {
  if (cache && Date.now() - cacheAt < CACHE_MS) return cache;
  try {
    const res = await fetch("https://api.brawlapi.com/v1/icons", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return cache; // en cas d'échec, on garde l'ancien cache s'il existe
    cache = (await res.json()) as IconsResponse;
    cacheAt = Date.now();
    return cache;
  } catch {
    return cache;
  }
}

export async function getPlayerIconUrl(iconId: number): Promise<string | null> {
  const icons = await getIcons();
  return icons?.player[String(iconId)]?.imageUrl ?? null;
}

export async function getClubBadgeUrl(badgeId: number): Promise<string | null> {
  const icons = await getIcons();
  return icons?.club[String(badgeId)]?.imageUrl ?? null;
}
