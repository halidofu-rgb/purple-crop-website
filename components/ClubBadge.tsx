const PALETTE = ["#9F7AEA", "#45E0D0", "#FF6E8F", "#F5B963", "#C4B5FD"];

function hashTag(tag: string): number {
  let h = 0;
  for (const ch of tag) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

// Emblème généré à partir du tag du club — PAS le vrai badge Supercell
// (l'API ne renvoie qu'un badgeId numérique, et on n'a pas le droit de
// réutiliser les icônes du jeu). Un même club garde toujours le même
// emblème, dérivé de manière stable de son tag.
export default function ClubBadge({ tag, size = 40 }: { tag: string; size?: number }) {
  const h = hashTag(tag);
  const colorA = PALETTE[h % PALETTE.length];
  const colorB = PALETTE[(h >> 3) % PALETTE.length];

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id={`g-${tag}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colorA} />
          <stop offset="100%" stopColor={colorB} />
        </linearGradient>
      </defs>
      <path
        d="M20 2L36 10V22C36 30 29 36 20 39C11 36 4 30 4 22V10L20 2Z"
        fill={`url(#g-${tag})`}
        opacity="0.9"
      />
      <path
        d="M20 2L36 10V22C36 30 29 36 20 39C11 36 4 30 4 22V10L20 2Z"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
    </svg>
  );
}
