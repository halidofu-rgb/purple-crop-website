import { shouldRethrow } from "@/lib/brawlstars";
import { getAllDiscordLevels } from "@/lib/draftbotLevels";
import { getXpBaseline } from "@/lib/discordXp";
import { getVoiceSeconds, getVoiceNames } from "@/lib/discordVoice";
import { getCurrentSeason } from "@/lib/season";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Tabs from "@/components/Tabs";
import PageBanner from "@/components/PageBanner";
import ClassementBoard, { ClassementEntry } from "@/components/ClassementBoard";
import { PushGlyph } from "@/components/icons";

export const revalidate = 900;

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

// Activité Discord : classement des membres du serveur, sans notion de club.
// Aucune liaison de compte n'est nécessaire : tout vient de l'id Discord.
export default async function ActivitePage() {
  const season = getCurrentSeason();

  const [levels, baseline, voiceSeconds, voiceNames] = await Promise.all([
    // Hors build, une panne remonte : Next garde alors la dernière page
    // correcte au lieu de figer « indisponible » pendant 15 minutes.
    getAllDiscordLevels().catch((err) => {
      if (shouldRethrow(err)) throw err;
      return null;
    }),
    getXpBaseline(season.key).catch(() => null),
    getVoiceSeconds(season.key).catch(() => ({} as Record<string, number>)),
    getVoiceNames().catch(() => ({} as Record<string, string>)),
  ]);

  // Comptes à ne pas classer (ex. le gérant du serveur) : ids Discord séparés
  // par des virgules dans la variable ACTIVITY_EXCLUDE_IDS.
  const excluded = new Set(
    (process.env.ACTIVITY_EXCLUDE_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  if (!levels) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[70vh] items-center justify-center px-6 text-center">
          <div>
            <h1 className="text-2xl font-bold text-paper">Activité Discord indisponible</h1>
            <p className="mt-2 max-w-md text-sm text-steel-400">
              Impossible de lire le classement de niveaux pour l&apos;instant. Réessaie dans
              quelques minutes.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const nameOf = (id: string) => levels[id]?.name ?? voiceNames[id] ?? "Membre Discord";
  const noLink = { tag: "", href: null } as const;

  const gainEntries: ClassementEntry[] = [];
  const totalEntries: ClassementEntry[] = [];

  for (const [id, lvl] of Object.entries(levels)) {
    if (excluded.has(id)) continue;
    const gain = baseline ? Math.max(0, lvl.totalXp - (baseline.users[id] ?? 0)) : 0;
    const base = { ...noLink, tag: `discord-${id}`, name: lvl.name, detail: `Niveau ${lvl.level}` };

    totalEntries.push({ ...base, value: lvl.totalXp, delta: baseline ? gain : undefined });
    if (gain > 0) gainEntries.push({ ...base, value: gain });
  }

  // Vocal : valeur en heures (arrondie à 0,1 h), seulement à partir de 6 minutes.
  const voiceEntries: ClassementEntry[] = [];
  for (const [id, seconds] of Object.entries(voiceSeconds)) {
    if (excluded.has(id) || seconds < 360) continue;
    voiceEntries.push({
      ...noLink,
      tag: `discord-${id}`,
      name: nameOf(id),
      value: Math.round(seconds / 360) / 10,
    });
  }
  const totalVoiceHours = voiceEntries.reduce((sum, e) => sum + e.value, 0);

  // Score d'activité = XP texte gagnée sur la saison + vocal converti en XP.
  // Taux par défaut = celui de DraftBot pour le vocal (≈ 20 XP / 2 min, soit
  // 600 XP/h) ; modifiable avec la variable VOICE_XP_PER_HOUR.
  const voiceXpPerHour =
    Number(process.env.VOICE_XP_PER_HOUR) > 0 ? Number(process.env.VOICE_XP_PER_HOUR) : 600;
  const scoreEntries: ClassementEntry[] = [];
  for (const id of new Set([...Object.keys(levels), ...Object.keys(voiceSeconds)])) {
    if (excluded.has(id)) continue;
    const lvl = levels[id];
    const textGain = lvl && baseline ? Math.max(0, lvl.totalXp - (baseline.users[id] ?? 0)) : 0;
    const seconds = voiceSeconds[id] ?? 0;
    const score = textGain + Math.round((seconds / 3600) * voiceXpPerHour);
    if (score <= 0) continue;
    const hours = (seconds / 3600).toFixed(1).replace(".", ",");
    scoreEntries.push({
      ...noLink,
      tag: `discord-${id}`,
      name: nameOf(id),
      value: score,
      detail: `${formatNumber(textGain)} XP texte · ${hours} h vocal`,
    });
  }

  const totalGain = gainEntries.reduce((sum, e) => sum + e.value, 0);

  const note = baseline
    ? baseline.exact
      ? `XP gagnée depuis le début de la saison (${formatDay(baseline.sourceDate)}).`
      : `XP gagnée depuis le ${formatDay(baseline.sourceDate)} — début du suivi : les jours précédents de la saison ne sont pas comptés.`
    : "La photo de départ de la saison n'a pas encore été prise : elle l'est au prochain passage automatique (chaque matin).";

  const dot = (
    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal shadow-[0_0_8px_#45E0D0]" />
  );

  const scorePanel = (
    <div>
      <p className="mb-4 flex items-center gap-2.5 text-xs text-steel-400">
        {dot}
        Score = XP gagnée à l&apos;écrit + temps en vocal (1 h en vocal = {formatNumber(voiceXpPerHour)}{" "}
        XP). {baseline ? note : ""}
      </p>
      <ClassementBoard
        entries={scoreEntries}
        clubNames={[]}
        valueLabel="Score"
        valueIcon={<PushGlyph className="h-4 w-4 shrink-0" />}
        emptyMessage="Pas encore de données : le suivi démarre au prochain passage automatique."
      />
    </div>
  );

  const gainPanel = (
    <div>
      <p className="mb-4 flex items-center gap-2.5 text-xs text-steel-400">
        {dot}
        {note}
      </p>
      <ClassementBoard
        entries={gainEntries}
        clubNames={[]}
        valueLabel="XP gagnée"
        valueIcon={<PushGlyph className="h-4 w-4 shrink-0" />}
        emptyMessage={
          baseline
            ? "Personne n'a encore gagné d'XP depuis le début du suivi."
            : "Pas encore de données : la photo de départ arrive au prochain passage automatique."
        }
      />
    </div>
  );

  const voicePanel = (
    <div>
      <p className="mb-4 flex items-center gap-2.5 text-xs text-steel-400">
        {dot}
        Temps passé en vocal cette saison, relevé régulièrement. Les membres dans le salon AFK
        ou avec le micro coupé ne sont pas comptés.
      </p>
      <ClassementBoard
        entries={voiceEntries}
        clubNames={[]}
        valueLabel="Heures en vocal"
        emptyMessage="Pas encore de données : le suivi du vocal démarre au prochain relevé."
      />
    </div>
  );

  const totalPanel = (
    <div>
      <p className="mb-4 flex items-center gap-2.5 text-xs text-steel-400">
        {dot}
        XP totale sur le Discord, depuis toujours. Le badge indique le gain de la saison.
      </p>
      <ClassementBoard
        entries={totalEntries}
        clubNames={[]}
        valueLabel="XP totale"
        deltaLabel="Saison"
        emptyMessage="Aucun membre classé."
      />
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen animate-fadeInUp px-4 pb-20 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-[1160px]">
          <PageBanner
            flush
            kicker={`Purple Corp — Saison ${season.label}`}
            title={
              <>
                Activité
                <br />
                Discord
              </>
            }
            intro="Qui est le plus actif sur le Discord cette saison : messages écrits et temps en vocal réunis en un seul score."
            stats={[
              { value: formatNumber(scoreEntries.length), label: "Membres actifs" },
              { value: formatNumber(totalGain), label: "XP gagnée" },
              { value: formatNumber(Math.round(totalVoiceHours)), label: "Heures en vocal" },
            ]}
          />

          <Tabs
            attached
            defaultTab="score"
            tabs={[
              { id: "score", label: "Activité", panel: scorePanel },
              { id: "gain", label: "Texte", panel: gainPanel },
              { id: "voice", label: "Vocal", panel: voicePanel },
              { id: "total", label: "XP totale", panel: totalPanel },
            ]}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
