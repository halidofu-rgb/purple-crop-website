import Link from "next/link";
import { Club, sortByTrophies } from "@/lib/brawlstars";
import { discordUrlForTag } from "@/lib/clubs";
import { rankLabelFromApi } from "@/lib/rankedTier";
import { avatarColor } from "@/lib/avatarColor";
import ClubBadge from "@/components/ClubBadge";
import RankGlyph from "@/components/RankGlyph";
import Tabs from "@/components/Tabs";

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

function playerHref(tag: string): string {
  return `/joueurs/${encodeURIComponent(tag.replace(/^#/, ""))}`;
}

const ROW = "grid grid-cols-[48px_minmax(0,1fr)_112px] items-center gap-3.5 px-4 sm:px-6";

function Avatar({ name }: { name: string }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-ink"
      style={{ backgroundColor: avatarColor(name) }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

/** En-tête de colonne des listes d'effectif. */
function RosterHeader({ valueLabel }: { valueLabel: string }) {
  return (
    <div
      className={`${ROW} border-b border-paper/10 py-3.5 text-[10.5px] uppercase tracking-[0.14em] text-steel-600`}
    >
      <span>Rang</span>
      <span>Membre</span>
      <span className="text-right">{valueLabel}</span>
    </div>
  );
}

function RosterRow({
  index,
  tag,
  name,
  sub,
  value,
  tone = "accent",
  last,
}: {
  index: number;
  tag: string;
  name: string;
  sub?: string;
  value: string;
  tone?: "accent" | "signal" | "blush" | "muted";
  last: boolean;
}) {
  const valueColor = {
    accent: "text-zest2",
    signal: "text-signal",
    blush: "text-blush",
    muted: "text-steel-400",
  }[tone];

  return (
    <Link
      href={playerHref(tag)}
      className={`${ROW} py-3 no-underline transition hover:bg-panel2 ${
        last ? "" : "border-b border-paper/[0.07]"
      }`}
    >
      <span className="rank-index text-xs text-zest">[{String(index + 1).padStart(2, "0")}]</span>
      <span className="flex min-w-0 items-center gap-3">
        <Avatar name={name} />
        <span className="min-w-0">
          <span className="block truncate text-sm text-paper">{name}</span>
          {sub && <span className="block truncate text-xs text-steel-400">{sub}</span>}
        </span>
      </span>
      <span className={`stat-mono whitespace-nowrap text-right text-[15px] ${valueColor}`}>
        {value}
      </span>
    </Link>
  );
}

/** Coquille des panneaux : collée sous la barre d'onglets (pas d'arrondi haut). */
function RosterPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-b-2xl border border-t-0 border-paper/10 bg-panel">
      {children}
    </div>
  );
}

function EmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-b-2xl border border-t-0 border-paper/10 bg-panel px-6 py-8 text-sm text-steel-400">
      {children}
    </div>
  );
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
  const average = roster.length > 0 ? Math.round(club.trophies / roster.length) : 0;
  const discordUrl = discordUrlForTag(club.tag);

  const trophiesPanel = (
    <RosterPanel>
      <RosterHeader valueLabel="Trophées" />
      {roster.map((member, i) => (
        <RosterRow
          key={member.tag}
          index={i}
          tag={member.tag}
          name={member.name}
          sub={ROLE_LABEL[member.role] ?? member.role}
          value={formatNumber(member.trophies)}
          last={i === roster.length - 1}
        />
      ))}
    </RosterPanel>
  );

  const pushRoster = pushByTag
    ? [...roster].sort(
        (a, b) => (pushByTag.get(b.tag) ?? -Infinity) - (pushByTag.get(a.tag) ?? -Infinity)
      )
    : [];

  const pushPanel =
    pushByTag && pushByTag.size > 0 ? (
      <RosterPanel>
        <RosterHeader valueLabel="Push" />
        {pushRoster.map((member, i) => {
          const delta = pushByTag.get(member.tag);
          return (
            <RosterRow
              key={member.tag}
              index={i}
              tag={member.tag}
              name={member.name}
              sub={ROLE_LABEL[member.role] ?? member.role}
              value={delta === undefined ? "—" : `${delta >= 0 ? "+" : "−"}${formatNumber(Math.abs(delta))}`}
              tone={delta === undefined ? "muted" : delta >= 0 ? "signal" : "blush"}
              last={i === pushRoster.length - 1}
            />
          );
        })}
      </RosterPanel>
    ) : (
      <EmptyPanel>
        Pas encore de photo de départ pour {seasonLabel ?? "cette saison"} — le push apparaîtra dès
        le premier instantané de la saison.
      </EmptyPanel>
    );

  const rankedPanel =
    rankedRows.length > 0 ? (
      <RosterPanel>
        <RosterHeader valueLabel="Elo" />
        {rankedRows.map((row, i) => (
          <RosterRow
            key={row.tag}
            index={i}
            tag={row.tag}
            name={row.name}
            sub={`${rankLabelFromApi(row.rankName)} · record ${formatNumber(row.bestElo)}`}
            value={formatNumber(row.elo)}
            tone="signal"
            last={i === rankedRows.length - 1}
          />
        ))}
      </RosterPanel>
    ) : (
      <EmptyPanel>
        Personne dans ce club n&apos;a encore de rang Ranked (débloqué à 1 000 trophées, puis un
        premier combat Ranked joué).
      </EmptyPanel>
    );

  return (
    <main className="min-h-screen animate-fadeInUp px-4 pb-24 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-[1160px]">
        {/* Bannière : même construction que PageBanner, enrichie des méta du club. */}
        <div className="relative overflow-hidden border-x border-b border-paper/10 bg-[linear-gradient(160deg,#262a60_0%,#1b1d33_48%,#161826_100%)]">
          <div className="pointer-events-none absolute inset-0 opacity-30 bg-[linear-gradient(90deg,rgba(233,233,237,0.06)_1px,transparent_1px)] bg-[length:64px_64px]" />
          <div className="pointer-events-none absolute -top-[150px] -right-[90px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(181,171,252,0.2),transparent_65%)]" />
          <div className="pointer-events-none absolute inset-y-0 left-[72%] w-px -skew-x-12 bg-gradient-to-b from-zest2/45 to-transparent" />

          <div className="relative grid items-end gap-10 px-6 pt-14 pb-8 sm:px-10 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <ClubBadge tag={club.tag} badgeId={club.badgeId} size={34} />
                <span className="rounded-md border border-zest2/40 bg-iris/55 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.14em] text-zest2">
                  {TYPE_LABEL[club.type] ?? club.type}
                </span>
                <span className="stat-mono text-[11.5px] text-steel-600">{club.tag}</span>
                <span className="text-[11px] uppercase tracking-[0.14em] text-ash">
                  {formatNumber(club.requiredTrophies)} trophées requis
                </span>
              </div>

              <h1 className="font-display text-[clamp(40px,5.4vw,72px)] font-medium uppercase leading-[0.94] tracking-[-0.035em] text-paper">
                {club.name}
              </h1>

              <p className="mt-4 max-w-[520px] text-[15.5px] leading-relaxed text-steel-400">
                {club.description || "Pas de description."}
              </p>

              {discordUrl && (
                <a
                  href={discordUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-block rounded-lg border border-zest px-5 py-2.5 text-[12.5px] uppercase tracking-[0.12em] text-zest2 no-underline transition hover:bg-zest/15 active:bg-zest/25"
                >
                  Rejoindre le Discord
                </a>
              )}
            </div>

            <div className="lg:justify-self-end lg:text-right">
              <p className="text-[11px] uppercase tracking-[0.16em] text-ash">Trophées cumulés</p>
              <p className="stat-mono mt-2 whitespace-nowrap text-[clamp(44px,5vw,64px)] leading-none tracking-[-0.03em] text-zest2">
                {formatNumber(club.trophies)}
              </p>
              <dl className="mt-5 flex lg:justify-end">
                <div className="pr-5 lg:text-right">
                  <dd className="stat-mono whitespace-nowrap text-[22px] leading-none text-paper">
                    {formatNumber(average)}
                  </dd>
                  <dt className="mt-1.5 text-[10.5px] uppercase tracking-[0.14em] text-ash">
                    Moy. / membre
                  </dt>
                </div>
                <div className="border-l border-paper/15 px-5 lg:text-right">
                  <dd className="stat-mono whitespace-nowrap text-[22px] leading-none text-paper">
                    {roster.length}
                  </dd>
                  <dt className="mt-1.5 text-[10.5px] uppercase tracking-[0.14em] text-ash">
                    Membres
                  </dt>
                </div>
                <div className="border-l border-paper/15 pl-5 lg:text-right">
                  <dd className="stat-mono whitespace-nowrap text-[22px] leading-none text-paper">
                    {clubRank ? `#${clubRank}` : "—"}
                    {totalClubs ? <span className="text-steel-600"> / {totalClubs}</span> : null}
                  </dd>
                  <dt className="mt-1.5 text-[10.5px] uppercase tracking-[0.14em] text-ash">
                    Dans Purple Corp
                  </dt>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <Tabs
          seamless
          tabs={[
            { id: "trophies", label: "Trophées", panel: trophiesPanel },
            { id: "push", label: `Push${seasonLabel ? ` · ${seasonLabel}` : ""}`, panel: pushPanel },
            {
              id: "ranked",
              label: "Ranked",
              icon: <RankGlyph className="h-3.5 w-3.5" />,
              panel: rankedPanel,
            },
          ]}
        />
      </div>
    </main>
  );
}
