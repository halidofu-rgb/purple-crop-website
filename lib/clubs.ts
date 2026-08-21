// Config centrale des clubs de Purple Corp. Pour ajouter un club plus tard,
// il suffit d'ajouter une ligne ici (aucun autre fichier à toucher).
// discordUrl est optionnel — l'API Brawl Stars ne fournit aucun lien
// Discord, donc si tu en as un, indique-le ici à la main.
export const CLUBS = [
  { tag: "80CLJG9LQ", label: "Purple Line", discordUrl: "" },
  { tag: "2QJ0Q29CL", label: "Indigo Line", discordUrl: "" },
  { tag: "2Q29PJVYL", label: "Iris Line", discordUrl: "" },
];

export function clubTags(): string[] {
  const raw = process.env.CLUB_TAGS;
  if (raw) return raw.split(",").map((t) => t.trim()).filter(Boolean);
  return CLUBS.map((c) => c.tag);
}

export function discordUrlForTag(tag: string): string | undefined {
  const clean = tag.replace(/^#/, "").toUpperCase();
  const found = CLUBS.find((c) => c.tag.replace(/^#/, "").toUpperCase() === clean);
  return found?.discordUrl || undefined;
}
