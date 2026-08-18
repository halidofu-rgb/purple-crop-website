// Toute la logique d'appel à l'API officielle Brawl Stars vit ici, et
// uniquement ici. Ce fichier n'est jamais importé depuis un composant
// "client" : la clé API ne quitte donc jamais le serveur.
//
// On passe par le proxy de RoyaleAPI (https://docs.royaleapi.com/proxy.html)
// car l'API Supercell exige une clé liée à une IP fixe, alors que Vercel
// exécute les fonctions serverless depuis des IP qui changent. Le proxy a
// lui-même une IP fixe : c'est CETTE IP qu'on whiteliste sur le site
// developer.brawlstars.com, pas celle de Vercel.

const BASE_URL = "https://bsproxy.royaleapi.dev/v1";

function apiKey(): string {
  const key = process.env.BRAWL_STARS_API_KEY;
  if (!key) {
    throw new Error(
      "BRAWL_STARS_API_KEY manquante. Ajoute-la dans les variables d'environnement Vercel (voir README)."
    );
  }
  return key;
}

async function bsFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      Accept: "application/json",
    },
    // Les trophées bougent en continu : on rafraîchit le cache toutes les
    // 2 minutes plutôt que de rappeler l'API à chaque visite du site.
    next: { revalidate: 120 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brawl Stars API ${res.status} sur ${path} : ${body}`);
  }

  return res.json() as Promise<T>;
}

// Un tag de club/joueur peut être saisi avec ou sans "#", en minuscule ou
// majuscule : on normalise avant d'appeler l'API.
export function normalizeTag(tag: string): string {
  const cleaned = tag.trim().toUpperCase().replace(/^#/, "");
  return `%23${cleaned}`;
}

export interface ClubMember {
  tag: string;
  name: string;
  role: "member" | "president" | "senior" | "vicePresident";
  trophies: number;
  nameColor?: string;
}

export interface Club {
  tag: string;
  name: string;
  description: string;
  type: "open" | "inviteOnly" | "closed";
  badgeId: number;
  requiredTrophies: number;
  trophies: number;
  members: ClubMember[];
}

export interface PlayerRankedInfo {
  currentSeason?: {
    trophies: number;
    rank?: string;
  };
}

export interface Player {
  tag: string;
  name: string;
  trophies: number;
  highestTrophies: number;
  expLevel: number;
  club?: { tag: string; name: string };
  soloVictories: number;
  duoVictories: number;
  "3vs3Victories": number;
  brawlers: { id: number; name: string; power: number; trophies: number }[];
}

export async function getClub(tag: string): Promise<Club> {
  return bsFetch<Club>(`/clubs/${normalizeTag(tag)}`);
}

export async function getPlayer(tag: string): Promise<Player> {
  return bsFetch<Player>(`/players/${normalizeTag(tag)}`);
}

// Petit utilitaire de tri partagé par les pages "classement".
export function sortByTrophies(members: ClubMember[]): ClubMember[] {
  return [...members].sort((a, b) => b.trophies - a.trophies);
}
