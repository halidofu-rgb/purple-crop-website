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
  icon: { id: number };
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

export interface BattleLogItem {
  battleTime: string; // format brut Supercell : "20260818T060224.000Z"
  battle: {
    type: string;
    result?: "victory" | "defeat" | "draw";
    trophyChange?: number; // absent sur Power League / Ranked classiques
  };
}

// Supercell ne garde que les 25 derniers combats par joueur, pas plus —
// c'est une limite de LEUR API, pas de notre code.
export async function getBattleLog(tag: string): Promise<BattleLogItem[]> {
  const data = await bsFetch<{ items: BattleLogItem[] }>(
    `/players/${normalizeTag(tag)}/battlelog`
  );
  return data.items;
}

// Convertit le format de date brut de l'API ("20260818T060224.000Z") en Date JS.
export function parseBattleTime(raw: string): Date {
  const iso = raw.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
    "$1-$2-$3T$4:$5:$6"
  );
  return new Date(iso);
}

// Petit utilitaire de tri partagé par les pages "classement".
export function sortByTrophies(members: ClubMember[]): ClubMember[] {
  return [...members].sort((a, b) => b.trophies - a.trophies);
}

export interface RankedSummary {
  delta: number;
  wins: number;
  losses: number;
  games: number;
}

// Résume l'activité Ranked d'un joueur sur ses 25 derniers combats — c'est
// la seule fenêtre que l'API expose, impossible d'aller plus loin (pas de
// score Ranked absolu ni d'historique de saison côté Supercell).
export async function getRankedSummary(tag: string): Promise<RankedSummary> {
  const items = await getBattleLog(tag);
  let delta = 0;
  let wins = 0;
  let losses = 0;
  let games = 0;

  for (const item of items) {
    const type = item.battle.type?.toLowerCase() ?? "";
    if (!type.includes("ranked")) continue;
    games += 1;
    if (typeof item.battle.trophyChange === "number") delta += item.battle.trophyChange;
    if (item.battle.result === "victory") wins += 1;
    else if (item.battle.result === "defeat") losses += 1;
  }

  return { delta, wins, losses, games };
}
