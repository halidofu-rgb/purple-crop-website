"use client";

import { useState } from "react";
import RankTierIcon from "@/components/RankTierIcon";
import { avatarColor } from "@/lib/avatarColor";
import { rankedTierIconPath } from "@/lib/rankedTier";

const SIZES = {
  sm: { box: "h-9 w-9 text-sm", badge: "h-7 w-7 -bottom-2 -right-2" },
  lg: { box: "h-11 w-11 text-[17px]", badge: "h-8 w-8 -bottom-2 -right-2" },
};

// Vraie icône de profil Brawl Stars quand on la connaît, sinon l'initiale
// colorée d'avant — jamais d'image cassée (repli si le chargement échoue).
// Pastille de rang Ranked en surimpression quand rankLabel est fourni.
export default function PlayerAvatar({
  name,
  iconUrl,
  rankLabel,
  rankIconSrc,
  size = "sm",
}: {
  name: string;
  iconUrl?: string | null;
  rankLabel?: string | null;
  rankIconSrc?: string | null;
  size?: keyof typeof SIZES;
}) {
  const [failed, setFailed] = useState(false);
  const s = SIZES[size];
  const showIcon = !!iconUrl && !failed;

  return (
    <span
      className={`relative flex ${s.box} shrink-0 items-center justify-center rounded-full font-medium text-ink`}
      style={showIcon ? undefined : { backgroundColor: avatarColor(name) }}
    >
      {showIcon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconUrl!}
          alt=""
          className="h-full w-full rounded-full border border-paper/15 bg-panel2 object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        name.trim().charAt(0).toUpperCase()
      )}
      {rankLabel && (
        <RankTierIcon
          src={rankIconSrc ?? rankedTierIconPath(rankLabel)}
          label={rankLabel}
          className={`absolute ${s.badge} rounded-full border-2 border-panel bg-panel2 p-0.5 shadow-[0_0_8px_rgba(0,0,0,0.35)]`}
        />
      )}
    </span>
  );
}
