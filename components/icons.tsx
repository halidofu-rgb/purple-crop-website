"use client";

// Icônes originales "façon pin émaillé" — dessinées pour Purple Corp au
// départ. Trophée/Couronne/Push essaient maintenant d'abord une vraie
// image locale (public/icons/…, à héberger toi-même — voir README) et
// retombent sur ce dessin original si le fichier n'existe pas encore.
// Bouclier et Épées restent 100% originaux (rien d'équivalent côté jeu).
import RealIcon from "@/components/RealIcon";

function GlyphBase({
  className,
  children,
  gradId,
  from,
  to,
}: {
  className?: string;
  children: React.ReactNode;
  gradId: string;
  from: string;
  to: string;
}) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      {children}
    </svg>
  );
}

function TrophyFallback({ className }: { className?: string }) {
  return (
    <GlyphBase className={className} gradId="trophy-grad" from="#F5D93E" to="#E0A93B">
      <path
        d="M10 6h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V6Z"
        fill="url(#trophy-grad)"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="0.6"
      />
      <path d="M10 7H6a3 3 0 0 0 3 5" fill="none" stroke="#E0A93B" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M22 7h4a3 3 0 0 1-3 5" fill="none" stroke="#E0A93B" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="14" y="15" width="4" height="4" fill="#E0A93B" />
      <path d="M11 25a5 5 0 0 1 10 0Z" fill="url(#trophy-grad)" />
      <rect x="9" y="24.5" width="14" height="2" rx="1" fill="#C98A2E" />
    </GlyphBase>
  );
}

export function TrophyGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <RealIcon
      src="/icons/trophy.png"
      alt="Trophées"
      className={className}
      fallback={<TrophyFallback className={className} />}
    />
  );
}

function CrownFallback({ className }: { className?: string }) {
  return (
    <GlyphBase className={className} gradId="crown-grad" from="#C4B5FD" to="#9F7AEA">
      <path
        d="M5 13l4 4 7-8 7 8 4-4-2 12H7L5 13Z"
        fill="url(#crown-grad)"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      <circle cx="5" cy="12" r="1.6" fill="#C4B5FD" />
      <circle cx="16" cy="8" r="1.6" fill="#C4B5FD" />
      <circle cx="27" cy="12" r="1.6" fill="#C4B5FD" />
    </GlyphBase>
  );
}

export function CrownGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <RealIcon
      src="/icons/crown.png"
      alt="Roi du push"
      className={className}
      fallback={<CrownFallback className={className} />}
    />
  );
}

function PushFallback({ className }: { className?: string }) {
  return (
    <GlyphBase className={className} gradId="push-grad" from="#5FE0C0" to="#45E0D0">
      <path
        d="M16 4l9 11h-6v13h-6V15H7l9-11Z"
        fill="url(#push-grad)"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </GlyphBase>
  );
}

export function PushGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <RealIcon
      src="/icons/push.png"
      alt="Push"
      className={className}
      fallback={<PushFallback className={className} />}
    />
  );
}

export function ShieldGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <GlyphBase className={className} gradId="shield-grad" from="#C4B5FD" to="#7C5CD1">
      <path
        d="M16 3l10 4v8c0 7-4.5 11.5-10 14C10.5 26.5 6 22 6 15V7l10-4Z"
        fill="url(#shield-grad)"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="0.6"
      />
      <path d="M11 15.5l3.5 3.5L21 12" fill="none" stroke="#0D0916" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
    </GlyphBase>
  );
}

export function SwordsGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <GlyphBase className={className} gradId="swords-grad" from="#FF9BB0" to="#FF6E8F">
      <path d="M4 28l9-9 2 2-9 9-3-1 1-1Z" fill="url(#swords-grad)" />
      <path d="M8 15L20 3l3 3-2 2 3 3-2 2-3-3-2 2L8 21l-3-3 3-3Z" fill="url(#swords-grad)" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
      <path d="M28 28l-9-9-2 2 9 9 3-1-1-1Z" fill="url(#swords-grad)" />
    </GlyphBase>
  );
}
