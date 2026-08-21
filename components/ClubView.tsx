import Link from "next/link";
import { Club, sortByTrophies } from "@/lib/brawlstars";
import { discordUrlForTag } from "@/lib/clubs";
import { rankLabelFromApi } from "@/lib/rankedTier";
import ClubBadge from "@/components/ClubBadge";
import RankGlyph from "@/components/RankGlyph";
import Badge from "@/components/Badge";
import Tabs from "@/components/Tabs";
import Button from "@/components/Button";

interface ClubRankedRow {
  tag: string;
  name: string;
  elo: number;
  rankName: string;
  bestElo: number;
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
    <ol className="divide-y divide-paper/10 rounded-2xl border border-paper/10 bg-panel">
      {roster.map((member, i) => (
        <li key={member.tag}>
          <Link
            href={`/joueurs/${encodeURIComponent(member.tag.replace(/^#/, ""))}`}
            className="flex items-center gap-4 px-4 py-3 transition hover:bg-panel2"
          >
            <span className="rank-index w-10 shrink-0 text-xs text-zest">{rankIndex(i)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-paper">
                {member.name}
              </p>
              <p className="text-xs text-steel-400">{ROLE_LABEL[member.role] ?? member.role}</p>
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
    <ol className="divide-y divide-paper/10 rounded-2xl border border-paper/10 bg-panel">
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
                <p className="truncate text-sm font-medium text-paper">
                  {member.name}
                </p>
              </div>
              <span
                className={`stat-mono shrink-0 text-base font-semibold ${
                  delta === undefined ? "text-steel-400" : delta >= 0 ? "text-signal" : "text-blush"
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
    <p className="rounded-2xl border border-paper/10 bg-panel px-4 py-6 text-center text-sm text-steel-400">
      Pas encore de photo de départ pour {seasonLabel ?? "cette saison"}.
    </p>
  );

  const rankedPanel = rankedRows.length > 0 ? (
    <>
      <div className="mb-3 flex items-start gap-2">
        <Badge tone="success">à jour</Badge>
        <p className="text-xs text-steel-400">
          Rang et Elo Ranked de chaque membre.
        </p>
      </div>
      <ol className="divide-y divide-paper/10 rounded-2xl border border-paper/10 bg-panel">
        {rankedRows.map((row, i) => (
          <li key={row.tag}>
            <Link
              href={`/joueurs/${encodeURIComponent(row.tag.replace(/^#/, ""))}`}
              className="flex items-center gap-4 px-4 py-3 transition hover:bg-panel2"
            >
              <span className="rank-index w-10 shrink-0 text-xs text-signal">{rankIndex(i)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-paper">{row.name}</p>
                <p className="text-[11px] text-steel-400">{rankLabelFromApi(row.rankName)}</p>
              </div>
              <Badge tone="neutral">record {formatNumber(row.bestElo)}</Badge>
              <span className="stat-mono shrink-0 text-base font-semibold text-signal">
                {formatNumber(row.elo)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  ) : (
    <p className="rounded-2xl border border-paper/10 bg-panel px-4 py-6 text-center text-sm text-steel-400">
      Personne dans ce club n&apos;a encore de rang Ranked (débloqué à 1 000 trophées, puis
      un premier combat Ranked joué).
    </p>
  );

  return (
    <main className="min-h-screen animate-fadeInUp px-4 py-10 sm:px-8 lg:px-16">
      <section className="relative overflow-hidden rounded-2xl border border-zest2/25 mx-auto max-w-4xl bg-panel px-6 py-8 text-center sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(181,171,252,0.18),transparent_65%)]" />
        <div className="relative flex justify-center">
          <ClubBadge tag={club.tag} badgeId={club.badgeId} size={52} />
        </div>
        <p className="mt-3 text-xs uppercase tracking-[0.3em] text-signal">
          {TYPE_LABEL[club.type] ?? club.type} · {formatNumber(club.requiredTrophies)} trophées requis
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-paper sm:text-5xl">
          {club.name}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-steel-400">
          {club.description || "Pas de description."}
        </p>
        {discordUrlForTag(club.tag) && (
          <div className="mt-4">
            <Button href={discordUrlForTag(club.tag)!} variant="secondary">
              Rejoindre le Discord
            </Button>
          </div>
        )}

        <div className="mt-8 border-t border-paper/10 pt-8">
          <p className="stat-mono text-5xl font-semibold text-zest sm:text-6xl">
            {formatNumber(club.trophies)}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-steel-400">
            Trophées cumulés · {club.members.length} membres
          </p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-paper/10 pt-6">
          <div>
            <p className="stat-mono text-xl font-semibold text-paper">
              {formatNumber(average)}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-steel-400">
              Moyenne / membre
            </p>
          </div>
          <div>
            <p className="truncate text-sm font-semibold text-paper">
              {best ? best.name : "—"}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-steel-400">Meilleur joueur</p>
          </div>
          <div>
            <p className="stat-mono text-xl font-semibold text-paper">
              {clubRank ? `#${clubRank}` : "—"}
              {totalClubs ? <span className="text-steel-400"> / {totalClubs}</span> : null}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-steel-400">
              Rang dans Purple Corp
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-3xl">
        <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-steel-400">
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
