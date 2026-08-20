import Link from "next/link";
import { getPlayer, getClub, getBattleLog, sortByTrophies } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline } from "@/lib/kv";
import { getMemberLinkByTag } from "@/lib/members";
import { getRankedTracking } from "@/lib/rankedTracking";
import { getCurrentSeason } from "@/lib/season";
import { avatarColor } from "@/lib/avatarColor";
import { getPlayerIconUrl } from "@/lib/assets";
import { rankedTierLabel, rankedTierIconPath, rankedTierProgress } from "@/lib/rankedTier";
import RankTierIcon from "@/components/RankTierIcon";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RankGlyph from "@/components/RankGlyph";
import Badge from "@/components/Badge";
import { TrophyGlyph, PushGlyph } from "@/components/icons";
import { Link2 } from "lucide-react";
import { notFound } from "next/navigation";

// Le rang dans le club / global et le push dépendent de données croisées
// (tous les clubs, Redis) — on calcule à chaque requête plutôt que de figer
// au build.
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  president: "Président",
  vicePresident: "Vice-président",
  senior: "Ancien",
  member: "Membre",
};

// Traduction FR des modes de jeu les plus courants — la donnée brute vient
// de l'API en anglais ("gemGrab", "brawlBall"...).
const MODE_LABEL: Record<string, string> = {
  gemGrab: "Razzia de gemmes",
  brawlBall: "Ballon brawl",
  heist: "Braquage",
  bounty: "Chasse à l'étoile",
  siege: "Siège",
  hotZone: "Zone réservée",
  knockout: "K.O.",
  duoShowdown: "Survivant duo",
  soloShowdown: "Survivant solo",
  duels: "Duel",
  wipeout: "Débandade",
  basketBrawl: "Basket brawl",
  volleyBrawl: "Volley brawl",
  ranked: "Ranked",
};

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function rankIndex(i: number): string {
  return `[${String(i + 1).padStart(2, "0")}]`;
}

export default async function PlayerPage({ params }: { params: { tag: string } }) {
  let player;
  try {
    player = await getPlayer(params.tag);
  } catch (err) {
    console.error(err);
    notFound();
  }

  const season = getCurrentSeason();
  const allTags = clubTags();

  const [allClubs, baseline, memberLink, avatarUrl, rankedTracking, battleLog] = await Promise.all([
    Promise.all(
      allTags.map(async (tag) => {
        try {
          return await getClub(tag);
        } catch {
          return null;
        }
      })
    ),
    getSeasonBaseline(season.key).catch(() => null),
    getMemberLinkByTag(params.tag).catch(() => null),
    getPlayerIconUrl(player.icon?.id).catch(() => null),
    getRankedTracking(params.tag).catch(() => null),
    getBattleLog(params.tag).catch(() => []),
  ]);

  const loadedClubs = allClubs.filter((c): c is NonNullable<typeof c> => c !== null);
  const homeClub = loadedClubs.find((c) => c.tag === player.club?.tag);
  const clubMember = homeClub?.members.find((m) => m.tag === player.tag);

  let clubRank: number | undefined;
  if (homeClub) {
    const roster = sortByTrophies(homeClub.members);
    const idx = roster.findIndex((m) => m.tag === player.tag);
    if (idx >= 0) clubRank = idx + 1;
  }

  const allMembers = loadedClubs.flatMap((c) => c.members).sort((a, b) => b.trophies - a.trophies);
  const globalIdx = allMembers.findIndex((m) => m.tag === player.tag);
  const globalRank = globalIdx >= 0 ? globalIdx + 1 : undefined;

  let seasonPush: number | undefined;
  if (baseline) {
    const before = baseline.players.find((p) => p.tag === player.tag);
    if (before) seasonPush = player.trophies - before.trophies;
  }

  const brawlers = [...player.brawlers].sort((a, b) => b.trophies - a.trophies);
  const totalVictories = player.soloVictories + player.duoVictories + player["3vs3Victories"];
  const modeStats = [
    { value: player["3vs3Victories"], label: "3v3" },
    { value: player.soloVictories, label: "Solo" },
    { value: player.duoVictories, label: "Duo" },
  ];
  const maxModeVictories = Math.max(...modeStats.map((m) => m.value), 1);

  const rankedCurrent = rankedTracking?.updatedAt ? rankedTracking.current : null;
  const rankedProgress = rankedCurrent !== null ? rankedTierProgress(rankedCurrent) : null;

  const recentMatches = battleLog.slice(0, 5);

  return (
    <>
      <Navbar />
      <main className="animate-fadeInUp">
        <section className="px-4 pb-8 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1200px]">
            {/* ── bannière ── */}
            <div className="relative overflow-hidden rounded-b-2xl border-x border-b border-paper/10 bg-[linear-gradient(160deg,#262a60_0%,#1b1d33_45%,#161826_100%)]">
              <div className="pointer-events-none absolute inset-0 opacity-35 bg-[linear-gradient(90deg,rgba(233,233,237,0.06)_1px,transparent_1px)] bg-[size:64px_64px]" />
              <div className="pointer-events-none absolute -right-20 -top-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(181,171,252,0.22),transparent_65%)]" />

              <div className="relative grid items-end gap-6 px-5 pb-7 pt-9 sm:px-8 sm:pt-11 lg:grid-cols-[auto_1fr_auto]">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-24 w-24 shrink-0 rounded-2xl border border-zest2/45 bg-panel object-contain p-2 shadow-[0_0_40px_rgba(181,171,252,0.25)] sm:h-28 sm:w-28"
                  />
                ) : (
                  <span
                    className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-zest2/45 text-3xl font-semibold text-ink shadow-[0_0_40px_rgba(181,171,252,0.25)] sm:h-28 sm:w-28"
                    style={{ backgroundColor: avatarColor(player.name) }}
                  >
                    {player.name.trim().charAt(0).toUpperCase()}
                  </span>
                )}

                <div className="pb-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2.5">
                    {player.club && (
                      <span className="rounded-md border border-zest2/40 bg-iris/50 px-2.5 py-1 text-[11px] tracking-[0.14em] uppercase text-zest2">
                        {player.club.name}
                      </span>
                    )}
                    {clubMember && (
                      <span className="text-[11px] tracking-[0.14em] uppercase text-steel-500">
                        {ROLE_LABEL[clubMember.role] ?? clubMember.role}
                      </span>
                    )}
                    {memberLink && (
                      <Badge tone="success" icon={<Link2 className="h-3 w-3" />}>
                        Discord lié
                      </Badge>
                    )}
                    <span className="text-[11px] tracking-[0.14em] uppercase text-steel-600">
                      #{player.tag.replace(/^#/, "")}
                    </span>
                  </div>
                  <h1 className="font-display text-4xl leading-[0.95] font-medium tracking-[-0.03em] uppercase text-paper sm:text-5xl lg:text-[56px]">
                    {player.name}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-steel-400">
                    <span>Niveau {player.expLevel}</span>
                    {player.club && (
                      <>
                        <span className="text-steel-800">/</span>
                        <Link
                          href={`/clubs/${encodeURIComponent(player.club.tag.replace(/^#/, ""))}`}
                          className="text-zest2 hover:underline"
                        >
                          Voir le club ›
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                <div className="pb-1 text-left lg:text-right">
                  <p className="flex items-center gap-1.5 text-[11px] tracking-[0.16em] uppercase text-steel-500 lg:justify-end">
                    <TrophyGlyph className="h-3.5 w-3.5" /> Trophées
                  </p>
                  <p className="stat-mono text-[44px] leading-none tracking-[-0.03em] text-zest2 [text-shadow:0_0_40px_rgba(181,171,252,0.4)] sm:text-[52px]">
                    {formatNumber(player.trophies)}
                  </p>
                  {seasonPush !== undefined && (
                    <p
                      className={`mt-1 flex items-center gap-1 text-xs lg:justify-end ${
                        seasonPush >= 0 ? "text-zest2" : "text-blush"
                      }`}
                    >
                      <PushGlyph className="h-3 w-3" />
                      {seasonPush >= 0 ? "+" : ""}
                      {formatNumber(seasonPush)} cette saison
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── corps ── */}
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  {modeStats.map((m) => (
                    <div key={m.label} className="rounded-2xl border border-paper/10 bg-panel p-5">
                      <p className="text-[11px] tracking-[0.14em] uppercase text-steel-600">
                        Victoires {m.label}
                      </p>
                      <p className="stat-mono mt-2 text-3xl tracking-[-0.02em] text-paper">
                        {formatNumber(m.value)}
                      </p>
                      <div className="mt-3 h-[3px] rounded-full bg-paper/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-iris to-zest2"
                          style={{ width: `${Math.round((m.value / maxModeVictories) * 100)}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-steel-500">
                        {totalVictories > 0 ? Math.round((m.value / totalVictories) * 100) : 0}% des
                        victoires totales
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-paper/10 bg-panel p-6">
                  <div className="mb-4 flex items-baseline justify-between">
                    <h2 className="text-[11px] tracking-[0.16em] uppercase text-steel-500">
                      Top brawlers
                    </h2>
                    <span className="text-[11px] tracking-[0.1em] uppercase text-steel-600">
                      {brawlers.length} au total
                    </span>
                  </div>
                  <ul className="flex flex-col gap-0.5">
                    {brawlers.slice(0, 8).map((b, i) => (
                      <li
                        key={b.id}
                        className="flex items-center gap-3.5 border-t border-paper/[0.08] py-2.5 first:border-none"
                      >
                        <span className="rank-index w-8 shrink-0 text-xs text-zest2">
                          {rankIndex(i)}
                        </span>
                        <span className="flex-1 truncate text-sm text-paper">{b.name}</span>
                        <span className="text-[11px] uppercase tracking-wide text-steel-600">
                          puissance {b.power}
                        </span>
                        <span className="stat-mono w-16 shrink-0 text-right text-sm text-zest2">
                          {formatNumber(b.trophies)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {/* rang Ranked : la carte "premium" de la fiche */}
                {rankedCurrent !== null && rankedProgress ? (
                  <div className="relative overflow-hidden rounded-2xl border border-zest2/35 bg-gradient-to-b from-iris/60 to-panel/90 p-6">
                    <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(181,171,252,0.25),transparent_65%)]" />
                    <div className="relative">
                      <p className="text-[11px] tracking-[0.16em] uppercase text-zest2">
                        Rang Ranked — {season.label}
                      </p>
                      <div className="mt-4 flex items-center gap-4">
                        <RankTierIcon
                          src={rankedTierIconPath(rankedProgress.label)}
                          label={rankedProgress.label}
                          className="h-14 w-14 shrink-0"
                        />
                        <div>
                          <p className="text-2xl leading-tight tracking-[-0.02em] text-paper">
                            {rankedProgress.label}
                          </p>
                          {rankedTracking && (
                            <p className="mt-1 text-[12.5px] text-steel-400">
                              Meilleur : {rankedTierLabel(rankedTracking.allTimeBest)} (
                              {formatNumber(rankedTracking.allTimeBest)})
                            </p>
                          )}
                        </div>
                      </div>
                      {rankedProgress.next !== null && (
                        <div className="mt-5">
                          <div className="mb-2 flex justify-between text-[11.5px] text-steel-400">
                            <span>Vers le palier suivant</span>
                            <span className="stat-mono text-zest2">
                              {formatNumber(rankedCurrent)} / {formatNumber(rankedProgress.next)}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-paper/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-iris to-zest2"
                              style={{ width: `${Math.round(rankedProgress.fraction * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-paper/10 bg-panel p-6 text-center">
                    <RankGlyph className="mx-auto h-6 w-6 text-zest2" />
                    <p className="mt-3 text-sm text-steel-400">
                      Suivi Ranked pas encore alimenté pour ce joueur — revient après quelques
                      combats Ranked joués.
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-paper/10 bg-panel p-6">
                  <h2 className="mb-4 text-[11px] tracking-[0.16em] uppercase text-steel-500">
                    Derniers combats
                  </h2>
                  {recentMatches.length === 0 ? (
                    <p className="text-sm text-steel-500">Aucun combat récent disponible.</p>
                  ) : (
                    <ul className="flex flex-col gap-0.5">
                      {recentMatches.map((m, i) => {
                        const win = m.battle.result === "victory";
                        const draw = m.battle.result === "draw";
                        const modeKey = m.battle.mode ?? m.event?.mode;
                        const modeLabel = modeKey ? MODE_LABEL[modeKey] ?? modeKey : "Combat";
                        return (
                          <li
                            key={i}
                            className="flex items-center gap-3.5 border-t border-paper/[0.08] py-2.5 first:border-none"
                          >
                            <span
                              className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs ${
                                win
                                  ? "bg-zest/20 text-zest2"
                                  : draw
                                    ? "bg-paper/[0.08] text-steel-400"
                                    : "bg-paper/[0.07] text-steel-500"
                              }`}
                            >
                              {win ? "V" : draw ? "N" : "D"}
                            </span>
                            <span className={`flex-1 truncate text-[13.5px] ${win ? "text-paper" : "text-steel-400"}`}>
                              {modeLabel}
                              {m.event?.map ? ` — ${m.event.map}` : ""}
                            </span>
                            {typeof m.battle.trophyChange === "number" && (
                              <span className={`stat-mono text-xs ${m.battle.trophyChange >= 0 ? "text-zest2" : "text-steel-600"}`}>
                                {m.battle.trophyChange >= 0 ? "+" : ""}
                                {m.battle.trophyChange}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {globalRank && (
                  <div className="flex items-center justify-between rounded-2xl border border-paper/10 bg-panel/60 px-5 py-4">
                    <p className="text-xs tracking-[0.12em] uppercase text-steel-600">
                      Classement Purple Corp
                    </p>
                    <p className="stat-mono text-lg text-paper">
                      #{globalRank} <span className="text-steel-600">/ {allMembers.length}</span>
                    </p>
                  </div>
                )}
                {clubRank && (
                  <div className="flex items-center justify-between rounded-2xl border border-paper/10 bg-panel/60 px-5 py-4">
                    <p className="text-xs tracking-[0.12em] uppercase text-steel-600">
                      Rang dans son club
                    </p>
                    <p className="stat-mono text-lg text-paper">#{clubRank}</p>
                  </div>
                )}

                {memberLink?.bio && (
                  <div className="rounded-2xl border border-paper/10 bg-panel p-5">
                    <p className="mb-2 text-[11px] tracking-[0.16em] uppercase text-steel-600">
                      Présentation
                    </p>
                    <p className="text-sm text-steel-300">{memberLink.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
