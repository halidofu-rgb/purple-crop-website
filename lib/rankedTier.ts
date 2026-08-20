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
