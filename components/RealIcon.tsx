"use client";

import { useState, ReactNode } from "react";

// Icône réelle hébergée localement (public/icons/...), avec repli
// automatique sur un glyphe original si le fichier n'a pas encore été
// déposé — jamais d'image cassée à l'écran. Même principe que
// RankTierIcon, généralisé pour trophée/couronne/push/etc.
export default function RealIcon({
  src,
  alt,
  fallback,
  className = "h-5 w-5",
}: {
  src: string;
  alt: string;
  fallback: ReactNode;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`${className} object-contain`}
      onError={() => setFailed(true)}
    />
  );
}
