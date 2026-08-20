// Convertit un score Ranked (Elo) en nom de rang — Bronze I à Pro.
// Seuils confirmés par les notes de mise à jour Supercell elles-mêmes
// (relayées par le wiki du jeu) : 250 Elo par palier de Bronze à Gold,
// 500 de Diamond à Mythique, 750 en Légendaire, 1000 en Masters,
// Pro à partir de 11250. On n'invente rien : c'est un calcul, pas une
// donnée Ranked en soi (qu'on n'a de toute façon pas).
const TIERS = [
  "Bronze I", "Bronze II", "Bronze III",
  "Argent I", "Argent II", "Argent III",
  "Or I", "Or II", "Or III",
  "Diamant I", "Diamant II", "Diamant III",
  "Mythique I", "Mythique II", "Mythique III",
  "Légendaire I", "Légendaire II", "Légendaire III",
  "Masters I", "Masters II", "Masters III",
];

const THRESHOLDS: number[] = (() => {
  const arr: number[] = [0];
  let total = 0;
  const steps = [250, 250, 250, 250, 250, 250, 250, 250, 500, 500, 500, 500, 500, 500, 750, 750, 750, 1000, 1000, 1000];
  for (const step of steps) {
    total += step;
    arr.push(total);
  }
  return arr;
})();

export function rankedTierLabel(elo: number): string {
  if (elo >= 11250) return "Pro";
  let idx = 0;
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (elo >= THRESHOLDS[i]) {
      idx = i;
      break;
    }
  }
  return TIERS[Math.min(idx, TIERS.length - 1)];
}

export interface RankedTierProgress {
  label: string;
  floor: number; // point d'entrée du palier actuel
  next: number | null; // point d'entrée du palier suivant (null si Pro)
  fraction: number; // 0 à 1, réel — calculé sur les vrais seuils du jeu
}

// Progression réelle vers le palier suivant, calculée sur les mêmes
// seuils que rankedTierLabel — pas une estimation, un vrai calcul.
export function rankedTierProgress(elo: number): RankedTierProgress {
  const label = rankedTierLabel(elo);
  if (label === "Pro") return { label, floor: 11250, next: null, fraction: 1 };

  const idx = TIERS.indexOf(label);
  const floor = THRESHOLDS[idx];
  const next = idx + 1 < THRESHOLDS.length ? THRESHOLDS[idx + 1] : 11250;
  const fraction = next > floor ? Math.min(1, Math.max(0, (elo - floor) / (next - floor))) : 1;
  return { label, floor, next, fraction };
}

const SLUG_BY_LABEL: Record<string, string> = {
  "Bronze I": "bronze-1", "Bronze II": "bronze-2", "Bronze III": "bronze-3",
  "Argent I": "argent-1", "Argent II": "argent-2", "Argent III": "argent-3",
  "Or I": "or-1", "Or II": "or-2", "Or III": "or-3",
  "Diamant I": "diamant-1", "Diamant II": "diamant-2", "Diamant III": "diamant-3",
  "Mythique I": "mythique-1", "Mythique II": "mythique-2", "Mythique III": "mythique-3",
  "Légendaire I": "legendaire-1", "Légendaire II": "legendaire-2", "Légendaire III": "legendaire-3",
  "Masters I": "masters-1", "Masters II": "masters-2", "Masters III": "masters-3",
  "Pro": "pro",
};

// Chemin de l'image locale correspondant à un libellé de rang — à héberger
// soi-même dans public/ranked-tiers/ (voir README). Retourne null si le
// libellé n'est pas reconnu, pour ne jamais générer un <img> cassé.
export function rankedTierIconPath(label: string): string | null {
  const slug = SLUG_BY_LABEL[label];
  return slug ? `/ranked-tiers/${slug}.png` : null;
}
