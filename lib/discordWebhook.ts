// Poste le classement final de push dans Discord via un webhook, à la
// clôture de chaque saison (voir app/api/cron/snapshot/route.ts). Simple
// appel fetch vers l'URL de webhook Discord — aucune dépendance externe.
import { SeasonPushRow } from "@/lib/seasonPush";
import { labelForKey } from "@/lib/season";

const TOP_N = 10;

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

export async function postSeasonRecapToDiscord(
  seasonKey: string,
  rows: SeasonPushRow[]
): Promise<{ sent: boolean; reason?: string }> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return { sent: false, reason: "DISCORD_WEBHOOK_URL absente côté Vercel" };

  const top = rows.slice(0, TOP_N);
  if (top.length === 0) return { sent: false, reason: "aucun joueur classé" };

  const lines = top.map((row, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    return `${medal} **${row.name}** — +${formatNumber(row.delta)} 🏆`;
  });

  const embed = {
    title: `👑 Roi du push — ${labelForKey(seasonKey)}`,
    description: lines.join("\n"),
    color: 0x7f77dd,
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error(`Discord webhook: réponse ${res.status}`, detail);
      return { sent: false, reason: `Discord a répondu ${res.status} : ${detail.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (err) {
    console.error("Discord webhook: échec de l'envoi", err);
    return { sent: false, reason: String(err) };
  }
}
