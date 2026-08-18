// Config centrale des clubs de Purple Corp. Pour ajouter un club plus tard,
// il suffit d'ajouter une ligne ici (aucun autre fichier à toucher).
export const CLUBS = [
  { tag: "80CLJG9LQ", label: "Purple Line" },
  { tag: "2QJ0Q29CL", label: "Indigo Line" },
];

export function clubTags(): string[] {
  const raw = process.env.CLUB_TAGS;
  if (raw) return raw.split(",").map((t) => t.trim()).filter(Boolean);
  return CLUBS.map((c) => c.tag);
}
