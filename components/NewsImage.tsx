"use client";

import { useState } from "react";

// Image externe collée par l'admin (simple URL, pas d'upload) — si elle ne
// charge pas, on masque proprement plutôt que d'afficher une icône cassée.
export default function NewsImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="max-h-[420px] w-full rounded-xl border border-paper/10 object-cover"
      onError={() => setFailed(true)}
    />
  );
}
