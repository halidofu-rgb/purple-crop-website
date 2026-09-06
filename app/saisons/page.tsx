import Link from "next/link";
import { getSeasonBaseline, listSeasonKeys, SeasonBaseline } from "@/lib/kv";
import { computeSeasonPush } from "@/lib/seasonPush";
import { getCurrentSeason, labelForKey } from "@/lib/season";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageBanner from "@/components/PageBanner";
import { CrownGlyph, PushGlyph } from "@/components/icons";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

interface SeasonSummary {
  key: string;
  label: string;
  totalPush: number;
  king: { name: string; delta: number } | null;
  ongoing: boolean;
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
      const rows = computeSeasonPush(current, next);
      const totalPush = rows.reduce((sum, r) => sum + r.delta, 0);
      const king = rows[0] ? { name: rows[0].name, delta: rows[0].delta } : null;
      summaries.push({
        key: current.seasonKey,
        label: labelForKey(current.seasonKey),
        totalPush,
        king,
        ongoing: false,
      });
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

  const closedCount = summaries.filter((s) => !s.ongoing).length;
  const bestSeason = summaries
    .filter((s) => !s.ongoing)
    .reduce<SeasonSummary | null>((best, s) => (!best || s.totalPush > best.totalPush ? s : best), null);

  return (
    <>
      <Navbar />
      <main className="min-h-screen animate-fadeInUp px-4 pb-20 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-[1160px]">
          <PageBanner
            kicker="Purple Corp"
            title="Saisons passées"
            intro="L'historique du push, saison après saison — se construit automatiquement au fil du temps, aucune action de notre part."
            stats={[
              { value: String(closedCount), label: "Saisons enregistrées" },
              {
                value: bestSeason ? `+${formatNumber(bestSeason.totalPush)}` : "—",
                label: bestSeason ? `Meilleure saison — ${bestSeason.label}` : "Meilleure saison",
              },
            ]}
          />

          <div className="mt-4 overflow-hidden rounded-2xl border border-paper/10 bg-panel">
            {summaries.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-steel-400">
                Pas encore d&apos;historique — reviens à la fin de la saison en cours.
              </p>
            ) : (
              <ol className="divide-y divide-paper/[0.07]">
                {summaries.map((s, i) => {
                  const row = (
                    <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-4">
                        <span className="rank-index w-8 shrink-0 text-xs text-zest2">
                          [{String(i + 1).padStart(2, "0")}]
                        </span>
                        <div>
                          <p className="text-[15px] text-paper">
                            {s.label}
                            {s.ongoing && (
                              <span className="ml-2 rounded-md border border-zest2/40 bg-iris/50 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-zest2">
                                En cours
                              </span>
                            )}
                          </p>
                          {s.ongoing ? (
                            <span className="text-xs text-zest2">Voir le direct sur /pusheurs →</span>
                          ) : (
                            s.king && (
                              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-steel-400">
                                <CrownGlyph className="h-3.5 w-3.5" />
                                {s.king.name}
                                <span className="stat-mono text-zest2">
                                  +{formatNumber(s.king.delta)}
                                </span>
                              </p>
                            )
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {!s.ongoing && (
                          <span className="stat-mono flex items-center gap-1.5 text-lg font-semibold text-zest2">
                            <PushGlyph className="h-4 w-4" />
                            +{formatNumber(s.totalPush)}
                          </span>
                        )}
                        {!s.ongoing && <ChevronRight className="h-4 w-4 text-steel-600" />}
                      </div>
                    </div>
                  );

                  return (
                    <li key={s.key}>
                      {s.ongoing ? (
                        <Link href="/pusheurs" className="block transition hover:bg-panel2">
                          {row}
                        </Link>
                      ) : (
                        <Link href={`/saisons/${s.key}`} className="block transition hover:bg-panel2">
                          {row}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
