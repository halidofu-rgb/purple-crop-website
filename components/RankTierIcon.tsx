"use client";

import { useState } from "react";
import RankGlyph from "@/components/RankGlyph";

// Icône de rang réelle, hébergée localement dans public/ranked-tiers/
// (voir README pour comment les récupérer). Si le fichier n'existe pas
// encore, on retombe automatiquement sur notre glyphe original — jamais
// d'image cassée à l'écran.
export default function RankTierIcon({
  src,
  label,
  className = "h-6 w-6",
}: {
  src: string | null;
  label: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <RankGlyph className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={label}
      className={`${className} object-contain`}
      onError={() => setFailed(true)}
    />
  );
}
