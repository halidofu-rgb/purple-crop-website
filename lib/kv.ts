// Stocke UNE photo des trophées de chaque membre au début de chaque saison
// Brawl Stars (1er jeudi du mois). La page /pusheurs compare les trophées
// actuels à cette photo pour savoir qui a le plus progressé "depuis le
// début de la saison" — exactement comme le classement "Roi du push".
//
// On utilise ioredis avec REDIS_URL (chaîne de connexion classique) : c'est
// le format injecté par l'intégration Redis du Vercel Marketplace. On garde
// la connexion en mémoire entre les appels pour éviter de se reconnecter à
// chaque requête sur une même instance serverless "chaude".
import Redis from "ioredis";

let client: Redis | null = null;

function getRedis(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error(
      "Aucune base Redis configurée (REDIS_URL manquante). Connecte l'intégration Redis depuis l'onglet Storage de ton projet Vercel (voir README)."
    );
  }
  if (!client) {
    client = new Redis(url);
  }
  return client;
}

export interface BaselinePlayer {
  tag: string;
  name: string;
  trophies: number;
  clubName: string;
}

export interface SeasonBaseline {
  seasonKey: string; // ex: "2026-08"
  capturedAt: string; // ISO — utile pour savoir si la photo date bien du début de saison
  players: BaselinePlayer[];
}

function baselineKey(seasonKey: string): string {
  return `purplecorp:season-baseline:${seasonKey}`;
}

export async function getSeasonBaseline(seasonKey: string): Promise<SeasonBaseline | null> {
  const redis = getRedis();
  const raw = await redis.get(baselineKey(seasonKey));
  if (!raw) return null;
  return JSON.parse(raw) as SeasonBaseline;
}

export async function setSeasonBaseline(baseline: SeasonBaseline): Promise<void> {
  const redis = getRedis();
  // Pas de TTL : on garde les baselines passées, ça ne coûte presque rien
  // en stockage et ça permet de consulter d'anciennes saisons plus tard.
  await redis.set(baselineKey(baseline.seasonKey), JSON.stringify(baseline));
}

// Liste toutes les saisons pour lesquelles une photo de départ existe,
// triées de la plus récente à la plus ancienne. Sert à la page "Saisons
// passées" — les données sont déjà là depuis le début, on ne fait que
// les retrouver.
export async function listSeasonKeys(): Promise<string[]> {
  const redis = getRedis();
  const keys = await redis.keys("purplecorp:season-baseline:*");
  return keys
    .map((k) => k.replace("purplecorp:season-baseline:", ""))
    .sort()
    .reverse();
}
