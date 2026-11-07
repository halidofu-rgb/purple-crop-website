import { getClub, shouldRethrow } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getMemberIconUrls } from "@/lib/assets";
import { listAllMemberLinks } from "@/lib/members";
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

const UNLINKED = "Compte non lié";
const OUT_OF_CLUBS = "Hors des clubs";

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

const normTag = (tag: string) => tag.replace(/^#/, "").toUpperCase();

export default async function ActivitePage() {
  const season = getCurrentSeason();

  const [levels, baseline, links, voiceSeconds, voiceNames] = await Promise.all([
    getAllDiscordLevels().catch(() => null),
    getXpBaseline(season.key).catch(() => null),
    listAllMemberLinks().catch(() => []),
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

  const clubs = await Promise.all(
    clubTags().map(async (tag) => {
      try {
        return await getClub(tag);
      } catch (err) {
        if (shouldRethrow(err)) throw err;
        return null;
      }
    })
  );
  const loadedClubs = clubs.filter((c): c is NonNullable<typeof c> => c !== null);
  const iconUrls = await getMemberIconUrls(loadedClubs).catch(() => ({} as Record<string, string>));

  const clubByTag = new Map<string, string>();
  for (const club of loadedClubs) {
    for (const m of club.members) clubByTag.set(normTag(m.tag), club.name);
  }
  const linkById = new Map(links.map((l) => [l.discordId, l]));

  const gainEntries: ClassementEntry[] = [];
  const totalEntries: ClassementEntry[] = [];
  const extraScopes = new Set<string>();

  // Champs communs d'une ligne de classement : club et lien si le compte
  // Discord est lié à un joueur Brawl Stars, sinon ligne sans lien.
  function baseFor(id: string, name: string): Omit<ClassementEntry, "value" | "delta"> {
    const link = linkById.get(id);
    const clubName = link ? clubByTag.get(normTag(link.tag)) ?? OUT_OF_CLUBS : UNLINKED;
    if (clubName === UNLINKED || clubName === OUT_OF_CLUBS) extraScopes.add(clubName);
    return {
      tag: link ? link.tag : `discord-${id}`,
      name,
      clubName,
      iconUrl: link ? iconUrls[`#${normTag(link.tag)}`] ?? iconUrls[normTag(link.tag)] : undefined,
      href: link ? undefined : null,
    };
  }

  for (const [id, lvl] of Object.entries(levels)) {
    if (excluded.has(id)) continue;
    const gain = baseline ? Math.max(0, lvl.totalXp - (baseline.users[id] ?? 0)) : 0;
    const base = baseFor(id, lvl.name);

    totalEntries.push({ ...base, value: lvl.totalXp, delta: baseline ? gain : undefined });
    if (gain > 0) gainEntries.push({ ...base, value: gain });
  }

  // Vocal : valeur en heures (arrondie à 0,1 h), seulement à partir de 6 minutes.
  const voiceEntries: ClassementEntry[] = [];
  for (const [id, seconds] of Object.entries(voiceSeconds)) {
    if (excluded.has(id) || seconds < 360) continue;
    const name =
      levels[id]?.name ?? voiceNames[id] ?? linkById.get(id)?.discordName ?? "Membre Discord";
    voiceEntries.push({ ...baseFor(id, name), value: Math.round(seconds / 360) / 10 });
  }
  const totalVoiceHours = voiceEntries.reduce((sum, e) => sum + e.value, 0);

  // Score d'activité = XP texte gagnée sur la saison + vocal converti en XP.
  // Taux par défaut = celui de DraftBot pour le vocal (≈ 20 XP / 2 min, soit
  // 600 XP/h) ; modifiable avec la variable VOICE_XP_PER_HOUR.
  const voiceXpPerHour = Number(process.env.VOICE_XP_PER_HOUR) > 0 ? Number(process.env.VOICE_XP_PER_HOUR) : 600;
  const scoreEntries: ClassementEntry[] = [];
  for (const id of new Set([...Object.keys(levels), ...Object.keys(voiceSeconds)])) {
    if (excluded.has(id)) continue;
    const lvl = levels[id];
    const textGain = lvl && baseline ? Math.max(0, lvl.totalXp - (baseline.users[id] ?? 0)) : 0;
    const seconds = voiceSeconds[id] ?? 0;
    const score = textGain + Math.round((seconds / 3600) * voiceXpPerHour);
    if (score <= 0) continue;
    const name = lvl?.name ?? voiceNames[id] ?? linkById.get(id)?.discordName ?? "Membre Discord";
    const hours = (seconds / 3600).toFixed(1).replace(".", ",");
    scoreEntries.push({
      ...baseFor(id, name),
      value: score,
      detail: `${formatNumber(textGain)} XP texte · ${hours} h vocal`,
    });
  }

  const clubNames = [...loadedClubs.map((c) => c.name), ...extraScopes];
  const totalGain = gainEntries.reduce((sum, e) => sum + e.value, 0);

  const note = baseline
    ? baseline.exact
      ? `XP gagnée depuis le début de la saison (${formatDay(baseline.sourceDate)}).`
      : `XP gagnée depuis le ${formatDay(baseline.sourceDate)} — début du suivi : les jours précédents de la saison ne sont pas comptés.`
    : "La photo de départ de la saison n'a pas encore été prise : elle l'est au prochain passage automatique (chaque matin).";

  const gainPanel = (
    <div>
      <p className="mb-4 flex items-center gap-2.5 text-xs text-steel-400">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal shadow-[0_0_8px_#45E0D0]" />
        {note}
      </p>
      <ClassementBoard
        entries={gainEntries}
        clubNames={clubNames}
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

  const totalPanel = (
    <div>
      <p className="mb-4 flex items-center gap-2.5 text-xs text-steel-400">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal shadow-[0_0_8px_#45E0D0]" />
        XP totale sur le Discord, depuis toujours. Le badge indique le gain de la saison.
      </p>
      <ClassementBoard
        entries={totalEntries}
        clubNames={clubNames}
        valueLabel="XP totale"
        deltaLabel="Saison"
        emptyMessage="Aucun membre classé."
      />
    </div>
  );

  const scorePanel = (
    <div>
      <p className="mb-4 flex items-center gap-2.5 text-xs text-steel-400">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal shadow-[0_0_8px_#45E0D0]" />
        Score = XP gagnée à l&apos;écrit + temps en vocal (1 h en vocal = {formatNumber(voiceXpPerHour)}{" "}
        XP). {baseline ? note : ""}
      </p>
      <ClassementBoard
        entries={scoreEntries}
        clubNames={clubNames}
        valueLabel="Score"
        valueIcon={<PushGlyph className="h-4 w-4 shrink-0" />}
        emptyMessage="Pas encore de données : le suivi démarre au prochain passage automatique."
      />
    </div>
  );

  const voicePanel = (
    <div>
      <p className="mb-4 flex items-center gap-2.5 text-xs text-steel-400">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal shadow-[0_0_8px_#45E0D0]" />
        Temps passé en vocal cette saison, relevé toutes les 10 minutes environ (sourdine et
        AFK compris).
      </p>
      <ClassementBoard
        entries={voiceEntries}
        clubNames={clubNames}
        valueLabel="Heures en vocal"
        emptyMessage="Pas encore de données : le suivi du vocal démarre au prochain relevé."
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
            intro="Qui est le plus actif sur le Discord cette saison : messages écrits et temps en vocal réunis en un seul score. Les membres dont le compte Discord est lié au site apparaissent avec leur club."
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
