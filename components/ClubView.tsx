import Link from "next/link";
import { Club, sortByTrophies } from "@/lib/brawlstars";
import { discordUrlForTag } from "@/lib/clubs";
import { rankedTierLabel } from "@/lib/rankedTier";
import ClubBadge from "@/components/ClubBadge";
import RankGlyph from "@/components/RankGlyph";
import Badge from "@/components/Badge";
import Tabs from "@/components/Tabs";
import Button from "@/components/Button";

interface ClubRankedRow {
  tag: string;
  name: string;
  rankedScore: number;
  rankedBest?: number;
}

const ROLE_LABEL: Record<string, string> = {
  president: "Président",
  vicePresident: "Vice-président",
  senior: "Ancien",
  member: "Membre",
};

const TYPE_LABEL: Record<string, string> = {
  open: "Ouvert à tous",
  inviteOnly: "Sur invitation",
  closed: "Fermé",
};

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function rankIndex(i: number): string {
  return `[${String(i + 1).padStart(2, "0")}]`;
}

export default function ClubView({
  club,
  clubRank,
  totalClubs,
  pushByTag,
  rankedRows = [],
  seasonLabel,
}: {
  club: Club;
  clubRank?: number;
  totalClubs?: number;
  pushByTag?: Map<string, number>;
  rankedRows?: ClubRankedRow[];
  seasonLabel?: string;
}) {
  const roster = sortByTrophies(club.members);
  const best = roster[0];
  const average = roster.length > 0 ? Math.round(club.trophies / roster.length) : 0;

  const trophiesPanel = (
    <ol className="divide-y divide-line rounded-2xl border border-line bg-panel">
      {roster.map((member, i) => (
        <li key={member.tag}>
          <Link
            href={`/joueurs/${encodeURIComponent(member.tag.replace(/^#/, ""))}`}
            className="flex items-center gap-4 px-4 py-3 transition hover:bg-panel2"
          >
            <span className="rank-index w-10 shrink-0 text-xs text-zest">{rankIndex(i)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-medium text-white">
                {member.name}
              </p>
              <p className="text-xs text-ash">{ROLE_LABEL[member.role] ?? member.role}</p>
            </div>
            <span className="stat-mono shrink-0 text-base font-semibold text-zest2">
              {formatNumber(member.trophies)}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );

  const pushRoster = pushByTag
    ? [...roster].sort((a, b) => (pushByTag.get(b.tag) ?? -Infinity) - (pushByTag.get(a.tag) ?? -Infinity))
    : [];
  const pushPanel = pushByTag && pushByTag.size > 0 ? (
    <ol className="divide-y divide-line rounded-2xl border border-line bg-panel">
      {pushRoster.map((member, i) => {
        const delta = pushByTag.get(member.tag);
        return (
          <li key={member.tag}>
            <Link
              href={`/joueurs/${encodeURIComponent(member.tag.replace(/^#/, ""))}`}
              className="flex items-center gap-4 px-4 py-3 transition hover:bg-panel2"
            >
              <span className="rank-index w-10 shrink-0 text-xs text-zest">{rankIndex(i)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-medium text-white">
                  {member.name}
                </p>
              </div>
              <span
                className={`stat-mono shrink-0 text-base font-semibold ${
                  delta === undefined ? "text-ash" : delta >= 0 ? "text-signal" : "text-blush"
                }`}
              >
                {delta === undefined ? "—" : `${delta >= 0 ? "+" : ""}${formatNumber(delta)}`}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  ) : (
    <p className="rounded-2xl border border-line bg-panel px-4 py-6 text-center text-sm text-ash">
      Pas encore de photo de départ pour {seasonLabel ?? "cette saison"}.
    </p>
  );

  const rankedPanel = rankedRows.length > 0 ? (
    <>
      <div className="mb-3 flex items-start gap-2">
        <Badge tone="warning">auto-déclaré</Badge>
        <p className="text-xs text-ash">
          Score indiqué par chaque membre depuis son compte lié (/compte).
        </p>
      </div>
      <ol className="divide-y divide-line rounded-2xl border border-line bg-panel">
        {rankedRows.map((row, i) => (
          <li key={row.tag}>
            <Link
              href={`/joueurs/${encodeURIComponent(row.tag.replace(/^#/, ""))}`}
              className="flex items-center gap-4 px-4 py-3 transition hover:bg-panel2"
            >
              <span className="rank-index w-10 shrink-0 text-xs text-signal">{rankIndex(i)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-medium text-white">{row.name}</p>
                <p className="text-[11px] text-ash">{rankedTierLabel(row.rankedScore)}</p>
              </div>
              {row.rankedBest !== undefined && (
                <Badge tone="neutral">all-time {formatNumber(row.rankedBest)}</Badge>
              )}
              <span className="stat-mono shrink-0 text-base font-semibold text-signal">
                {formatNumber(row.rankedScore)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  ) : (
    <p className="rounded-2xl border border-line bg-panel px-4 py-6 text-center text-sm text-ash">
      Personne n&apos;a encore lié son compte et indiqué son Ranked.{" "}
      <Link href="/compte" className="text-signal hover:underline">
        Sois le premier →
      </Link>
    </p>
  );

  return (
    <main className="min-h-screen animate-fadeInUp px-4 py-10 sm:px-8 lg:px-16">
      <section className="hud-frame mx-auto max-w-4xl bg-panel px-6 py-8 text-center sm:px-10 sm:py-10">
        <div className="flex justify-center">
          <ClubBadge tag={club.tag} badgeId={club.badgeId} size={52} />
        </div>
        <p className="mt-3 font-display text-xs uppercase tracking-[0.3em] text-signal">
          {TYPE_LABEL[club.type] ?? club.type} · {formatNumber(club.requiredTrophies)} trophées requis
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {club.name}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ash">
          {club.description || "Pas de description."}
        </p>
        {discordUrlForTag(club.tag) && (
          <div className="mt-4">
            <Button href={discordUrlForTag(club.tag)!} variant="secondary">
              Rejoindre le Discord
            </Button>
          </div>
        )}

        <div className="mt-8 border-t border-line pt-8">
          <p className="stat-mono text-5xl font-semibold text-zest sm:text-6xl">
            {formatNumber(club.trophies)}
          </p>
          <p className="mt-1 font-display text-xs uppercase tracking-[0.25em] text-ash">
            Trophées cumulés · {club.members.length} membres
          </p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-6">
          <div>
            <p className="stat-mono text-xl font-semibold text-white">
              {formatNumber(average)}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ash">
              Moyenne / membre
            </p>
          </div>
          <div>
            <p className="truncate font-display text-sm font-semibold text-white">
              {best ? best.name : "—"}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ash">Meilleur joueur</p>
          </div>
          <div>
            <p className="stat-mono text-xl font-semibold text-white">
              {clubRank ? `#${clubRank}` : "—"}
              {totalClubs ? <span className="text-ash"> / {totalClubs}</span> : null}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ash">
              Rang dans Purple Corp
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-3xl">
        <h2 className="mb-4 font-display text-xs uppercase tracking-[0.2em] text-ash">
          Effectif
        </h2>
        <Tabs
          tabs={[
            { id: "trophies", label: "Trophées", panel: trophiesPanel },
            { id: "push", label: `Push · ${seasonLabel ?? ""}`, panel: pushPanel },
            {
              id: "ranked",
              label: "Ranked",
              icon: <RankGlyph className="h-3.5 w-3.5" />,
              panel: rankedPanel,
            },
          ]}
        />
      </section>
    </main>
  );
}
