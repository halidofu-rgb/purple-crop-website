import Link from "next/link";
import { getPlayer, getClub, sortByTrophies } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline } from "@/lib/kv";
import { getMemberLinkByTag } from "@/lib/members";
import { getCurrentSeason } from "@/lib/season";
import { avatarColor } from "@/lib/avatarColor";
import { getPlayerIconUrl } from "@/lib/assets";
import { rankedTierLabel } from "@/lib/rankedTier";
import Navbar from "@/components/Navbar";
import RankGlyph from "@/components/RankGlyph";
import Badge from "@/components/Badge";
import { TrophyGlyph, PushGlyph } from "@/components/icons";
import { Link2, Users2, Sparkles } from "lucide-react";
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

  const [allClubs, baseline, memberLink, avatarUrl] = await Promise.all([
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
  ]);

  const loadedClubs = allClubs.filter((c): c is NonNullable<typeof c> => c !== null);
  const homeClub = loadedClubs.find((c) => c.tag === player.club?.tag);
  const clubMember = homeClub?.members.find((m) => m.tag === player.tag);

  // Rang du joueur au sein de son propre club.
  let clubRank: number | undefined;
  if (homeClub) {
    const roster = sortByTrophies(homeClub.members);
    const idx = roster.findIndex((m) => m.tag === player.tag);
    if (idx >= 0) clubRank = idx + 1;
  }

  // Rang du joueur toutes familles confondues (classement général).
  const allMembers = loadedClubs.flatMap((c) => c.members).sort((a, b) => b.trophies - a.trophies);
  const globalIdx = allMembers.findIndex((m) => m.tag === player.tag);
  const globalRank = globalIdx >= 0 ? globalIdx + 1 : undefined;

  // Push de la saison, si une photo de départ existe.
  let seasonPush: number | undefined;
  if (baseline) {
    const before = baseline.players.find((p) => p.tag === player.tag);
    if (before) seasonPush = player.trophies - before.trophies;
  }

  const brawlers = [...player.brawlers].sort((a, b) => b.trophies - a.trophies);

  const mainStats = [
    { icon: TrophyGlyph, value: formatNumber(player.trophies), label: "Total", title: "Trophées", colorClass: "" },
    ...(memberLink?.rankedScore !== undefined
      ? [{
          icon: RankGlyph,
          value: formatNumber(memberLink.rankedScore),
          label: rankedTierLabel(memberLink.rankedScore),
          title: "Ranked",
          colorClass: "text-signal",
        }]
      : []),
    ...(memberLink?.rankedBest !== undefined
      ? [{
          icon: RankGlyph,
          value: formatNumber(memberLink.rankedBest),
          label: rankedTierLabel(memberLink.rankedBest),
          title: "Ranked all-time",
          colorClass: "text-zest2",
        }]
      : []),
    ...(seasonPush !== undefined
      ? [{
          icon: PushGlyph,
          value: `${seasonPush >= 0 ? "+" : ""}${formatNumber(seasonPush)}`,
          label: clubRank ? `#${clubRank} club` : undefined,
          title: `Push ${season.label}`,
          colorClass: "",
        }]
      : []),
    { icon: Sparkles, value: String(player.expLevel), label: undefined, title: "Niveau d'XP", colorClass: "text-zest" },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen animate-fadeInUp px-4 py-10 sm:px-8 lg:max-w-4xl lg:mx-auto lg:px-0">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-signal">Joueur</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {player.name}
        </h1>
        <p className="mt-1 font-mono text-xs text-ash">#{player.tag.replace(/^#/, "")}</p>

        {/* En-tête profil */}
        <section className="mt-6 rounded-3xl border border-line bg-panel px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-2xl border border-line bg-panel2 object-contain p-1"
              />
            ) : (
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-xl font-bold text-ink"
                style={{ backgroundColor: avatarColor(player.name) }}
              >
                {player.name.trim().charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-lg font-semibold text-white">{player.name}</p>
                {clubMember && (
                  <Badge tone="primary">{ROLE_LABEL[clubMember.role] ?? clubMember.role}</Badge>
                )}
                {memberLink && (
                  <Badge tone="success" icon={<Link2 className="h-3 w-3" />}>
                    Discord lié
                  </Badge>
                )}
              </div>
              {player.club && (
                <Link
                  href={`/clubs/${encodeURIComponent(player.club.tag.replace(/^#/, ""))}`}
                  className="text-xs text-signal hover:underline"
                >
                  {player.club.name} ›
                </Link>
              )}
            </div>
            {globalRank && (
              <div className="text-right">
                <p className="stat-mono text-lg font-semibold text-white">
                  #{globalRank}
                  <span className="text-ash"> / {allMembers.length}</span>
                </p>
                <p className="text-[10px] uppercase tracking-wide text-ash">Purple Corp</p>
              </div>
            )}
          </div>
        </section>

        {/* Présentation */}
        <section className="mt-4 rounded-3xl border border-line bg-panel px-6 py-6 text-center sm:px-8">
          <p className="mb-2 font-display text-xs uppercase tracking-[0.2em] text-ash">
            Présentation
          </p>
          <p className="text-sm text-ash">
            {memberLink?.bio || `${player.name} n'a pas encore écrit de présentation.`}
          </p>
        </section>

        {/* 5 stats principales */}
        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {mainStats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="rounded-2xl border border-line bg-panel p-4">
                <Icon className={`h-6 w-6 ${s.colorClass}`} />
                <p className="mt-2 text-[10px] uppercase tracking-wide text-ash">{s.title}</p>
                <p className="stat-mono text-lg font-semibold text-white">{s.value}</p>
                {s.label && <p className="text-[10px] text-ash">{s.label}</p>}
              </div>
            );
          })}
        </section>

        {/* Victoires en jeu */}
        <section className="mt-4 rounded-3xl border border-line bg-panel px-6 py-6 sm:px-8">
          <h2 className="mb-4 font-display text-xs uppercase tracking-[0.2em] text-ash">
            Victoires en jeu
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: player["3vs3Victories"], label: "3v3" },
              { value: player.soloVictories, label: "Solo" },
              { value: player.duoVictories, label: "Duo" },
            ].map((v) => (
              <div key={v.label} className="rounded-xl border border-line bg-panel2 p-4 text-center">
                <Users2 className="mx-auto h-4 w-4 text-zest" />
                <p className="stat-mono mt-2 text-lg font-semibold text-white">
                  {formatNumber(v.value)}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-ash">{v.label} victoires</p>
              </div>
            ))}
          </div>
        </section>

        {/* Ranked 1v1 — pas de Casino : feature Discord custom qu'on n'a pas
            construite (voir /support). On l'annonce honnêtement, pas de
            fausse donnée "0 combat". */}
        <section className="mt-4 rounded-3xl border border-line bg-panel px-6 py-6 text-center sm:px-8">
          <h2 className="mb-3 flex items-center justify-center gap-1.5 font-display text-xs uppercase tracking-[0.2em] text-ash">
            <RankGlyph className="h-3.5 w-3.5" /> Ranked 1v1
          </h2>
          <p className="text-sm text-ash">Bientôt disponible.</p>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 font-display text-xs uppercase tracking-[0.2em] text-ash">
            Ses meilleurs brawlers
          </h2>
          <ol className="divide-y divide-line rounded-2xl border border-line bg-panel">
            {brawlers.slice(0, 15).map((b, i) => (
              <li key={b.id} className="flex items-center gap-4 px-4 py-3">
                <span className="rank-index w-9 shrink-0 text-xs text-zest">
                  {rankIndex(i)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-medium text-white">
                    {b.name}
                  </p>
                  <p className="text-xs text-ash">Puissance {b.power}</p>
                </div>
                <span className="stat-mono shrink-0 text-base font-semibold text-zest2">
                  {formatNumber(b.trophies)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}
