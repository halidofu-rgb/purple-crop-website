// Qui a le droit de publier une actualité — un seul compte Discord (le
// tien) pour l'instant, listé via son ID Discord dans les variables
// d'environnement Vercel. Pas de rôle en base à gérer.
export function isAdmin(discordId: string | null | undefined): boolean {
  if (!discordId) return false;
  const ids = (process.env.ADMIN_DISCORD_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return ids.includes(discordId);
}
