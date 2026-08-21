import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline } from "@/lib/kv";
import { getRankedRowsForClubs } from "@/lib/rankedLive";
import { rankLabelFromApi, rankedTierIconPath } from "@/lib/rankedTier";
import { getCurrentSeason, formatCountdown } from "@/lib/season";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Tabs from "@/components/Tabs";
import RankGlyph from "@/components/RankGlyph";
import { TrophyGlyph } from "@/components/icons";
import PusherLeaderboard, { PusherEntry } from "@/components/PusherLeaderboard";

export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

const ROLE_LABEL: Record<string, string> = {
  president: "Président",
  vicePresident: "Vice-président",
  senior: "Ancien",
  member: "Membre",
};

export default async function PusheursPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const season = getCurrentSeason();
  const tags = clubTags();
  const defaultTab = searchParams?.tab === "ranked" ? "ranked" : "push";

  let baseline;
  let baselineError: string | null = null;
  try {
    baseline = await getSeasonBaseline(season.key);
  } catch (err) {
    baselineError = (err as Error).message;
  }

  if (baselineError) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[70vh] items-center justify-center px-6 text-center">
          <div>
            <h1 className="text-2xl font-bold text-blush">
              Historique pas encore configuré
            </h1>
            <p className="mt-2 max-w-md text-sm text-steel-400">{baselineError}</p>
          </div>
        </main>
      </>
    );
  }

  if (!baseline) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[70vh] items-center justify-center px-6 text-center">
          <div>
            <h1 className="text-2xl font-bold text-paper">
              Saison {season.label} — pas encore de photo de départ
            </h1>
            <p className="mt-2 max-w-md text-sm text-steel-400">
              La capture automatique se déclenche chaque jour ; la première photo de cette
              saison n&apos;a pas encore été prise. Reviens dans les prochaines heures.
            </p>
          </div>
        </main>
      </>
    );
  }

  const clubs = await Promise.all(
    tags.map(async (tag) => {
      try {
        return await getClub(tag);
      } catch {
        return null;
      }
    })
  );
  const loadedClubs = clubs.filter((c): c is NonNullable<typeof c> => c !== null);

  const rankedRows = await getRankedRowsForClubs(loadedClubs).catch(() => []);
  const rankedByTag = new Map(rankedRows.map((r) => [r.tag.toUpperCase(), r]));
  const baselineByTag = new Map(baseline.players.map((p) => [p.tag, p]));

  const pushEntries: PusherEntry[] = loadedClubs.flatMap((club) =>
    club.members.map((m) => {
      const before = baselineByTag.get(m.tag);
      const delta = before ? m.trophies - before.trophies : 0;
      const ranked = rankedByTag.get(m.tag.toUpperCase());
      const rankLabel = ranked ? rankLabelFromApi(ranked.rankName) : null;
      return {
        tag: m.tag,
        name: m.name,
        clubName: club.name,
        role: ROLE_LABEL[m.role] ?? m.role,
        value: delta,
        rankLabel,
        rankIconSrc: rankLabel ? rankedTierIconPath(rankLabel) : null,
      };
    })
  );

  // Le rang Ranked (rankedElo) est déjà scopé à la saison en cours côté API
  // — pas besoin d'une photo de départ comme pour les trophées, la valeur
  // actuelle EST la progression de la saison.
  const rankedEntries: PusherEntry[] = loadedClubs.flatMap((club) =>
    club.members
      .map((m) => {
        const ranked = rankedByTag.get(m.tag.toUpperCase());
        if (!ranked) return null;
        const rankLabel = rankLabelFromApi(ranked.rankName);
        return {
          tag: m.tag,
          name: m.name,
          clubName: club.name,
          role: ROLE_LABEL[m.role] ?? m.role,
          value: ranked.elo,
          rankLabel,
          rankIconSrc: rankedTierIconPath(rankLabel),
        };
      })
      .filter((e): e is PusherEntry => e !== null)
  );

  const totalPush = pushEntries.reduce((sum, e) => sum + e.value, 0);
  const averagePush = pushEntries.length > 0 ? Math.round(totalPush / pushEntries.length) : 0;
  const clubNames = loadedClubs.map((c) => c.name);

  return (
    <>
      <Navbar />
      <main className="animate-fadeInUp">
        <section className="relative overflow-hidden border-b border-paper/10 px-4 sm:px-8 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_12%_0%,#262a60_0%,transparent_58%),radial-gradient(70%_70%_at_88%_30%,rgba(145,132,217,0.18)_0%,transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-45 bg-[linear-gradient(rgba(233,233,237,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(233,233,237,0.055)_1px,transparent_1px)] bg-[size:96px_96px] [mask-image:radial-gradient(90%_80%_at_20%_20%,#000,transparent)]" />
          <div className="pointer-events-none absolute inset-y-0 left-[70%] w-px -skew-x-12 bg-gradient-to-b from-transparent via-zest2/45 to-transparent" />

          <div className="relative mx-auto flex max-w-[1200px] flex-wrap items-end gap-8 py-14 sm:py-16">
            <div className="min-w-[280px] flex-1">
              <p className="mb-3 text-[11.5px] tracking-[0.16em] uppercase text-zest2">
                Pusheurs — {season.label}
              </p>
              <h1 className="font-display text-5xl leading-[0.94] font-medium tracking-[-0.035em] uppercase text-paper lg:text-[72px]">
                Qui progresse
                <br />
                <span className="text-zest2 [text-shadow:0_0_60px_rgba(181,171,252,0.4)]">
                  cette saison
                </span>
              </h1>
              <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-steel-400">
                Uniquement la progression depuis le début de la saison — pas les totaux cumulés
                (ça, c&apos;est le classement général). Trophées gagnés ou Elo Ranked, au choix
                ci-dessous.
              </p>
              <Link
                href="/saisons"
                className="mt-3 inline-block font-mono text-[11px] uppercase tracking-widest text-steel-400 transition hover:text-signal"
              >
                voir les saisons passées →
              </Link>
            </div>
            <dl className="flex border-t border-paper/10 pt-5">
              <div className="pr-6">
                <dd className="stat-mono text-[30px] leading-none tracking-[-0.02em] text-paper">
                  {totalPush >= 0 ? "+" : ""}
                  {formatNumber(totalPush)}
                </dd>
                <dt className="mt-1.5 text-[11px] tracking-[0.14em] uppercase text-steel-600">
                  Trophées gagnés (famille)
                </dt>
              </div>
              <div className="border-l border-paper/10 pl-6">
                <dd className="stat-mono text-[30px] leading-none tracking-[-0.02em] text-paper">
                  {averagePush >= 0 ? "+" : ""}
                  {formatNumber(averagePush)}
                </dd>
                <dt className="mt-1.5 text-[11px] tracking-[0.14em] uppercase text-steel-600">
                  Moyenne par joueur
                </dt>
              </div>
              <div className="border-l border-paper/10 pl-6">
                <dd className="stat-mono text-[30px] leading-none tracking-[-0.02em] text-zest2">
                  ⏳ {formatCountdown(season.end)}
                </dd>
                <dt className="mt-1.5 text-[11px] tracking-[0.14em] uppercase text-steel-600">
                  Avant la prochaine saison
                </dt>
              </div>
            </dl>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1200px]">
            <Tabs
              defaultTab={defaultTab}
              tabs={[
                {
                  id: "push",
                  label: "Trophées",
                  icon: <TrophyGlyph className="h-3.5 w-3.5" />,
                  panel: <PusherLeaderboard entries={pushEntries} clubNames={clubNames} mode="push" />,
                },
                {
                  id: "ranked",
                  label: "Ranked",
                  icon: <RankGlyph className="h-3.5 w-3.5" />,
                  panel: <PusherLeaderboard entries={rankedEntries} clubNames={clubNames} mode="ranked" />,
                },
              ]}
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
