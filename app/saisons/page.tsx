import Link from "next/link";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { getSeasonBaseline, listSeasonKeys, SeasonBaseline } from "@/lib/kv";
import { getCurrentSeason } from "@/lib/season";
import Navbar from "@/components/Navbar";
import { CrownGlyph } from "@/components/icons";

export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function labelForKey(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const MONTHS = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  return `${MONTHS[month - 1]} ${year}`;
}

interface SeasonSummary {
  key: string;
  label: string;
  totalPush: number;
  king: { name: string; delta: number } | null;
  ongoing: boolean;
}

// Calcule le push d'une saison PASSÉE en comparant sa photo de départ à
// celle de la saison suivante (= son propre point final). La saison en
// cours n'a pas encore de photo "de fin" : on ne peut afficher un vrai
// total que pour les saisons déjà terminées, sinon voir /pusheurs pour le
// direct.
function summarizeClosedSeason(start: SeasonBaseline, end: SeasonBaseline): SeasonSummary {
  const endByTag = new Map(end.players.map((p) => [p.tag, p]));
  let totalPush = 0;
  let king: { name: string; delta: number } | null = null;

  for (const p of start.players) {
    const after = endByTag.get(p.tag);
    if (!after) continue;
    const delta = after.trophies - p.trophies;
    totalPush += delta;
    if (!king || delta > king.delta) king = { name: p.name, delta };
  }

  return { key: start.seasonKey, label: labelForKey(start.seasonKey), totalPush, king, ongoing: false };
}

export default async function SaisonsPage() {
  const currentSeason = getCurrentSeason();
  const allKeys = (await listSeasonKeys().catch(() => [])).sort(); // ascendant

  const baselines = await Promise.all(
    allKeys.map(async (key) => ({ key, baseline: await getSeasonBaseline(key) }))
  );
  const validBaselines = baselines
    .filter((b): b is { key: string; baseline: SeasonBaseline } => b.baseline !== null)
    .map((b) => b.baseline);

  const summaries: SeasonSummary[] = [];
  for (let i = 0; i < validBaselines.length; i++) {
    const current = validBaselines[i];
    const next = validBaselines[i + 1];
    if (next) {
      summaries.push(summarizeClosedSeason(current, next));
    } else if (current.seasonKey === currentSeason.key) {
      // Saison en cours : pas de photo de fin, on renvoie vers /pusheurs
      // pour le direct plutôt que d'afficher un total figé et faux.
      summaries.push({
        key: current.seasonKey,
        label: labelForKey(current.seasonKey),
        totalPush: 0,
        king: null,
        ongoing: true,
      });
    }
  }
  summaries.reverse(); // plus récente en premier

  return (
    <>
      <Navbar />
      <main className="min-h-screen animate-fadeInUp px-4 py-10 sm:px-8 lg:px-16">
        <section className="mx-auto max-w-3xl text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-signal">
            Purple Corp
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Saisons passées
          </h1>
          <p className="mt-3 text-sm text-ash">
            L&apos;historique du push, saison après saison. Se construit automatiquement au fil
            du temps.
          </p>
        </section>

        <section className="mx-auto mt-10 max-w-3xl">
          {summaries.length === 0 ? (
            <p className="rounded-2xl border border-line bg-panel px-6 py-8 text-center text-sm text-ash">
              Pas encore d&apos;historique — reviens à la fin de la saison en cours.
            </p>
          ) : (
            <ol className="space-y-3">
              {summaries.map((s) => (
                <li
                  key={s.key}
                  className="flex items-center justify-between rounded-2xl border border-line bg-panel px-5 py-4"
                >
                  <div>
                    <p className="font-display text-sm font-semibold text-white">{s.label}</p>
                    {s.ongoing ? (
                      <Link href="/pusheurs" className="text-xs text-signal hover:underline">
                        En cours — voir le direct →
                      </Link>
                    ) : (
                      s.king && (
                        <p className="flex items-center gap-1 text-xs text-ash">
                          <CrownGlyph className="h-3 w-3" /> {s.king.name} · +
                          {formatNumber(s.king.delta)}
                        </p>
                      )
                    )}
                  </div>
                  {!s.ongoing && (
                    <span className="stat-mono text-lg font-semibold text-signal">
                      +{formatNumber(s.totalPush)}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </>
  );
}
