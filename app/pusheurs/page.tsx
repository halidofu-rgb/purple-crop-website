import Link from "next/link";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline } from "@/lib/kv";
import { getCurrentSeason, formatCountdown } from "@/lib/season";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function rankIndex(i: number): string {
  return `[${String(i + 1).padStart(2, "0")}]`;
}

const AVATAR_COLORS = ["#9F7AEA", "#45E0D0", "#FF6E8F", "#7C8CF5", "#C4B5FD", "#5FE0C0"];
function avatarColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface PushRow {
  tag: string;
  name: string;
  clubName: string;
  delta: number;
  trophies: number;
}

export default async function PusheursPage() {
  const season = getCurrentSeason();
  const tags = clubTags();

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
            <h1 className="font-display text-2xl font-bold text-blush">
              Historique pas encore configuré
            </h1>
            <p className="mt-2 max-w-md text-sm text-ash">{baselineError}</p>
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
            <h1 className="font-display text-2xl font-bold text-white">
              Saison {season.label} — pas encore de photo de départ
            </h1>
            <p className="mt-2 max-w-md text-sm text-ash">
              La capture automatique se déclenche chaque jour ; la première photo de cette
              saison n&apos;a pas encore été prise. Reviens dans les prochaines heures, ou force
              une capture manuelle (voir le README).
            </p>
          </div>
        </main>
      </>
    );
  }

  const currentClubs = await Promise.all(
    tags.map(async (tag) => {
      try {
        return await getClub(tag);
      } catch {
        return null;
      }
    })
  );

  const baselineByTag = new Map(baseline.players.map((p) => [p.tag, p]));

  const rows: PushRow[] = currentClubs
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .flatMap((club) =>
      club.members.map((m) => {
        const before = baselineByTag.get(m.tag);
        const delta = before ? m.trophies - before.trophies : 0;
        return { tag: m.tag, name: m.name, clubName: club.name, delta, trophies: m.trophies };
      })
    )
    .sort((a, b) => b.delta - a.delta);

  const totalPush = rows.reduce((sum, r) => sum + r.delta, 0);
  const king = rows[0];

  const trophyPanel = (
    <ol className="divide-y divide-line rounded-2xl border border-line bg-panel">
      {rows.map((row, i) => (
        <li key={row.tag}>
          <Link
            href={`/joueurs/${encodeURIComponent(row.tag.replace(/^#/, ""))}`}
            className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-panel2"
          >
            <span className="rank-index w-9 shrink-0 text-xs text-zest">{rankIndex(i)}</span>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-xs font-semibold text-ink"
              style={{ backgroundColor: avatarColor(row.name) }}
            >
              {row.name.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-medium text-white">
                {row.name} <span className="font-normal text-ash">{row.clubName}</span>
              </p>
              <p className="stat-mono text-[11px] text-ash">
                {formatNumber(row.trophies)} trophées
              </p>
            </div>
            <span
              className={`stat-mono shrink-0 text-sm font-semibold ${
                row.delta >= 0 ? "text-signal" : "text-blush"
              }`}
            >
              {row.delta >= 0 ? "+" : ""}
              {formatNumber(row.delta)}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen animate-fadeInUp px-4 py-10 sm:px-8 lg:px-16">
        <section className="hud-frame mx-auto max-w-3xl bg-panel px-6 py-8 sm:px-8">
          <p className="text-sm text-ash">
            Qui gagne le plus de trophées, saison après saison — le classement du push, pas des
            totaux.
          </p>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.25em] text-signal">
                Saison en cours
              </p>
              <h1 className="mt-1 font-display text-4xl font-semibold uppercase tracking-tight text-white sm:text-5xl">
                {season.label}
              </h1>
            </div>
            <p className="mt-2 font-mono text-xs text-ash">
              ⏳ encore {formatCountdown(season.end)}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-10 border-t border-line pt-6">
            <div>
              <p className="text-xs text-ash">Trophées gagnés par la famille</p>
              <p className="stat-mono mt-1 text-2xl font-semibold text-white">
                {formatNumber(totalPush)}
              </p>
            </div>
            {king && (
              <div>
                <p className="text-xs text-ash">👑 Roi du push</p>
                <p className="mt-1 font-display text-lg font-semibold text-white">
                  {king.name}{" "}
                  <span className="stat-mono text-signal">+{formatNumber(king.delta)}</span>
                </p>
              </div>
            )}
          </div>

          <p className="mt-8 text-xs leading-relaxed text-ash">
            <span className="font-semibold text-white">C&apos;est quoi le &quot;roi du push&quot; ?</span>{" "}
            Contrairement au classement des trophées cumulés, ici on ne regarde que la
            progression pendant la saison en cours — celui qui gagne le plus de trophées entre le
            début et maintenant. Repart à zéro à chaque nouvelle saison Brawl Stars (1er jeudi du
            mois), donc tout le monde a sa chance à chaque fois, peu importe son total all time.
          </p>
          <Link
            href="/saisons"
            className="mt-4 inline-block font-mono text-[11px] uppercase tracking-widest text-ash transition hover:text-signal"
          >
            voir les saisons passées →
          </Link>
        </section>

        <section className="mx-auto mt-8 max-w-3xl">
          <h2 className="mb-4 font-display text-xs uppercase tracking-[0.2em] text-ash">
            Push · {rows.length} joueurs
          </h2>
          {trophyPanel}
        </section>
      </main>
    </>
  );
}
