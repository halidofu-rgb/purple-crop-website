import { getClubBadgeUrl } from "@/lib/assets";

const PALETTE = ["#9F7AEA", "#45E0D0", "#FF6E8F", "#F5B963", "#C4B5FD"];

function hashTag(tag: string): number {
  let h = 0;
  for (const ch of tag) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function GeneratedBadge({ tag, size }: { tag: string; size: number }) {
  const h = hashTag(tag);
  // `>>> 3` (non signé) et pas `>> 3` : au-delà de 2^31 le décalage signé rend
  // un index négatif, donc `PALETTE[-3] === undefined` et le dégradé partait
  // vers du noir (c'était le cas du tag d'Indigo Line).
  const colorA = PALETTE[h % PALETTE.length];
  const colorB = PALETTE[(h >>> 3) % PALETTE.length];
  const gradientId = `club-badge-${tag.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colorA} />
          <stop offset="100%" stopColor={colorB} />
        </linearGradient>
      </defs>
      <path
        d="M20 2L36 10V22C36 30 29 36 20 39C11 36 4 30 4 22V10L20 2Z"
        fill={`url(#${gradientId})`}
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

// Vrai badge du club (BrawlAPI/Brawlify) quand badgeId est fourni et connu
// de leur CDN. Sinon, repli sur un emblème généré à partir du tag — jamais
// de case vide.
export default async function ClubBadge({
  tag,
  badgeId,
  size = 40,
}: {
  tag: string;
  badgeId?: number;
  size?: number;
}) {
  const realUrl = badgeId !== undefined ? await getClubBadgeUrl(badgeId).catch(() => null) : null;

  if (realUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={realUrl}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  }

  return <GeneratedBadge tag={tag} size={size} />;
}
