// Couleur d'avatar dérivée du nom — stable (même joueur = même couleur à
// chaque visite), partagée entre toutes les pages qui affichent des
// avatars générés (pas de vraie photo de profil côté Brawl Stars).
const AVATAR_COLORS = ["#9F7AEA", "#7C5CD1", "#45E0D0", "#FF6E8F", "#C4B5FD", "#F5B963"];

export function avatarColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
