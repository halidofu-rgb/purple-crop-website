import Link from "next/link";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline } from "@/lib/kv";
import { getCurrentSeason, formatCountdown } from "@/lib/season";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CrownGlyph } from "@/components/icons";
import { avatarColor } from "@/lib/avatarColor";

export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function rankIndex(i: number): string {
  return `[${String(i + 1).padStart(2, "0")}]`;
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
    <ol className="divide-y divide-paper/10 rounded-2xl border border-paper/10 bg-panel">
      {rows.map((row, i) => (
        <li key={row.tag}>
          <Link
            href={`/joueurs/${encodeURIComponent(row.tag.replace(/^#/, ""))}`}
            className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-panel2"
          >
            <span className="rank-index w-9 shrink-0 text-xs text-zest">{rankIndex(i)}</span>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-ink"
              style={{ backgroundColor: avatarColor(row.name) }}
            >
              {row.name.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-paper">
                {row.name} <span className="font-normal text-steel-400">{row.clubName}</span>
              </p>
              <p className="stat-mono text-[11px] text-steel-400">
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
        <section className="relative overflow-hidden rounded-2xl border border-zest2/25 mx-auto max-w-3xl bg-panel px-6 py-8 sm:px-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(181,171,252,0.18),transparent_65%)]" />
          <p className="relative text-sm text-steel-400">
            Qui gagne le plus de trophées, saison après saison — le classement du push, pas des
            totaux.
          </p>

          <div className="relative mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-signal">
                Saison en cours
              </p>
              <h1 className="mt-1 text-4xl font-semibold uppercase tracking-tight text-paper sm:text-5xl">
                {season.label}
              </h1>
            </div>
            <p className="mt-2 font-mono text-xs text-steel-400">
              ⏳ encore {formatCountdown(season.end)}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-10 border-t border-paper/10 pt-6">
            <div>
              <p className="text-xs text-steel-400">Trophées gagnés par la famille</p>
              <p className="stat-mono mt-1 text-2xl font-semibold text-paper">
                {formatNumber(totalPush)}
              </p>
            </div>
            {king && (
              <div>
                <p className="flex items-center gap-1 text-xs text-steel-400">
                  <CrownGlyph className="h-3.5 w-3.5" /> Roi du push
                </p>
                <p className="mt-1 text-lg font-semibold text-paper">
                  {king.name}{" "}
                  <span className="stat-mono text-signal">+{formatNumber(king.delta)}</span>
                </p>
              </div>
            )}
          </div>

          <p className="mt-8 text-xs leading-relaxed text-steel-400">
            <span className="font-semibold text-paper">C&apos;est quoi le &quot;roi du push&quot; ?</span>{" "}
            Contrairement au classement des trophées cumulés, ici on ne regarde que la
            progression pendant la saison en cours — celui qui gagne le plus de trophées entre le
            début et maintenant. Repart à zéro à chaque nouvelle saison Brawl Stars (1er jeudi du
            mois), donc tout le monde a sa chance à chaque fois, peu importe son total all time.
          </p>
          <Link
            href="/saisons"
            className="mt-4 inline-block font-mono text-[11px] uppercase tracking-widest text-steel-400 transition hover:text-signal"
          >
            voir les saisons passées →
          </Link>
        </section>

        <section className="mx-auto mt-8 max-w-3xl">
          <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-steel-400">
            Push · {rows.length} joueurs
          </h2>
          {trophyPanel}
        </section>
      </main>
      <Footer />
    </>
  );
}
