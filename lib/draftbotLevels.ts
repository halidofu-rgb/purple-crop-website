// XP / niveaux Discord, lus depuis le classement public de DraftBot
// (https://www.draftbot.fr/levels/<id du serveur>). La page web appelle
// elle-même cette API sans authentification, par pages d'environ 60 joueurs.
// Aucun bot ni token : on lit la même chose que ce que tout visiteur voit.
import { unstable_cache } from "next/cache";

const API_URL = "https://api.draftbot.fr/activities/levels";
const GUILD_ID = process.env.DRAFTBOT_GUILD_ID || "1424376123411796038";
const MAX_PAGES = 20; // garde-fou (4 pages aujourd'hui)

export interface DiscordLevel {
  name: string;
  level: number;
  totalXp: number;
  /** XP gagnée dans le niveau en cours / XP nécessaire pour passer au suivant. */
  currentLevelXp: number;
  levelXp: number;
  /** Position au classement du serveur (1 = premier). */
  rank: number;
}

interface ApiUser {
  id: string;
  displayName?: string;
  username?: string;
  level: number;
  currentLevelXp: string;
  levelXp: string;
  totalXp: string;
}

async function fetchPage(page: number): Promise<ApiUser[]> {
  const res = await fetch(`${API_URL}/${GUILD_ID}?page=${page}`, {
    headers: { "User-Agent": "PurpleCorpSite/1.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`DraftBot API ${res.status}`);
  const json = (await res.json()) as { users?: ApiUser[] };
  return json.users ?? [];
}

// Lit tout le classement (toutes les pages). Lève si l'API échoue : on ne
// veut jamais enregistrer un classement partiel comme si c'était complet.
export async function fetchAllDiscordLevels(): Promise<Record<string, DiscordLevel>> {
  const out: Record<string, DiscordLevel> = {};
  let rank = 0;
  for (let page = 0; page < MAX_PAGES; page++) {
    const users = await fetchPage(page);
    if (users.length === 0) break;
    for (const u of users) {
      rank += 1;
      out[u.id] = {
        name: u.displayName || u.username || u.id,
        level: u.level,
        totalXp: Number(u.totalXp),
        currentLevelXp: Number(u.currentLevelXp),
        levelXp: Number(u.levelXp),
        rank,
      };
    }
  }
  return out;
}

// Mis en cache 30 min : le classement bouge peu et on évite ~4 appels par
// visite de page. Si l'API échoue, la fonction lève (rien n'est mis en cache).
export const getAllDiscordLevels = unstable_cache(fetchAllDiscordLevels, ["draftbot-levels", GUILD_ID], {
  revalidate: 1800,
});

/** Niveau Discord d'un compte (id Discord), ou null s'il n'est pas classé. */
export async function getDiscordLevel(discordId: string): Promise<DiscordLevel | null> {
  const all = await getAllDiscordLevels();
  return all[discordId] ?? null;
}
