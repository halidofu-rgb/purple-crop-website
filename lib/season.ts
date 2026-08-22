// Une saison Brawl Stars démarre le 1er jeudi de chaque mois à 9h00 UTC
// pile — confirmé par Supercell lui-même sur X : "The current Ranked
// season ends tomorrow at 9 AM UTC!" (x.com/BrawlStars, avril 2026).

function firstThursday(year: number, month: number): Date {
  // month: 0-11
  const d = new Date(Date.UTC(year, month, 1, 9, 0, 0));
  const day = d.getUTCDay(); // 0 = dimanche ... 4 = jeudi
  const offset = (4 - day + 7) % 7;
  d.setUTCDate(1 + offset);
  return d;
}

export interface SeasonInfo {
  key: string; // "2026-08"
  label: string; // "Août 2026"
  start: Date;
  end: Date; // début de la saison suivante
}

const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export function getCurrentSeason(now: Date = new Date()): SeasonInfo {
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth();
  let start = firstThursday(year, month);

  // Si on est avant le 1er jeudi du mois courant, on est encore dans la
  // saison du mois précédent.
  if (now < start) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
    start = firstThursday(year, month);
  }

  let endMonth = month + 1;
  let endYear = year;
  if (endMonth > 11) {
    endMonth = 0;
    endYear += 1;
  }
  const end = firstThursday(endYear, endMonth);

  return {
    key: `${year}-${String(month + 1).padStart(2, "0")}`,
    label: `${MONTH_LABELS[month]} ${year}`,
    start,
    end,
  };
}

export function formatCountdown(target: Date, now: Date = new Date()): string {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return "d'un instant à l'autre";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  return `${days}j ${hours}h`;
}
