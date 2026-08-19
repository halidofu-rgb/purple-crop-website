// Glyphe "Ranked" original — un chevron double façon montée en grade, dans
// notre palette. Volontairement PAS un badge Supercell : on n'a pas les
// vraies données de rang, donc pas question d'afficher leurs icônes de rang.
export default function RankGlyph({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3L20 9.5L12 21L4 9.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 3L12 21" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}
