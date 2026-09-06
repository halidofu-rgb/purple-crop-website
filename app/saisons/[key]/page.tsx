import Link from "next/link";
import { getSeasonBaseline, listSeasonKeys } from "@/lib/kv";
import { computeSeasonPush } from "@/lib/seasonPush";
import { labelForKey } from "@/lib/season";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageBanner from "@/components/PageBanner";
import { avatarColor } from "@/lib/avatarColor";
import { PushGlyph } from "@/components/icons";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

export default async function SeasonDetailPage({ params }: { params: { key: string } }) {
  const allKeys = (await listSeasonKeys().catch(() => [])).sort(); // ascendant
  const idx = allKeys.indexOf(params.key);
  if (idx === -1) notFound();

  const nextKey = allKeys[idx + 1];
  if (!nextKey) {
    // Saison en cours (pas encore de photo de fin) — pas de détail figé à
    // afficher, /pusheurs a le direct.
    notFound();
  }

  const [start, end] = await Promise.all([
    getSeasonBaseline(params.key),
    getSeasonBaseline(nextKey),
  ]);
  if (!start || !end) notFound();

  const rows = computeSeasonPush(start, end);
  const totalPush = rows.reduce((sum, r) => sum + r.delta, 0);
  const maxDelta = Math.max(...rows.map((r) => r.delta), 1);

  return (
    <>
      <Navbar />
      <main className="min-h-screen animate-fadeInUp px-4 pb-20 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-[1160px]">
          <Link
            href="/saisons"
            className="mb-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-steel-400 transition hover:text-paper"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Toutes les saisons
          </Link>

          <PageBanner
            kicker="Purple Corp — Saison close"
            title={labelForKey(params.key)}
            intro="Le détail complet du push de chaque membre pour cette saison — figé, ça ne bougera plus."
            stats={[
              { value: String(rows.length), label: "Joueurs classés" },
              { value: `+${formatNumber(totalPush)}`, label: "Trophées gagnés (famille)" },
            ]}
          />

          <div className="mt-4 overflow-hidden rounded-2xl border border-paper/10 bg-panel">
            {rows.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-steel-400">
                Personne de suivi sur toute la durée de cette saison.
              </p>
            ) : (
              <>
                <div className="hidden items-center gap-4 border-b border-paper/10 px-5 py-3 text-[10.5px] uppercase tracking-[0.14em] text-steel-600 sm:grid sm:grid-cols-[48px_minmax(0,1fr)_180px]">
                  <span>Rang</span>
                  <span>Joueur</span>
                  <span className="text-right">Push de la saison</span>
                </div>
                <ol className="divide-y divide-paper/[0.07]">
                  {rows.map((row, i) => (
                    <li key={row.tag}>
                      <Link
                        href={`/joueurs/${encodeURIComponent(row.tag.replace(/^#/, ""))}`}
                        className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-panel2 sm:grid sm:grid-cols-[48px_minmax(0,1fr)_180px]"
                      >
                        <span className="stat-mono hidden text-lg text-steel-500 sm:block">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-ink"
                            style={{ backgroundColor: avatarColor(row.name) }}
                          >
                            {row.name.trim().charAt(0).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] text-paper">{row.name}</span>
                            <span className="block truncate text-[11.5px] text-steel-500">
                              {row.clubName}
                            </span>
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span className="hidden h-[3px] flex-1 rounded-full bg-paper/10 sm:block">
                            <span
                              className="block h-full rounded-full bg-gradient-to-r from-iris to-zest2"
                              style={{ width: `${Math.round((Math.max(row.delta, 0) / maxDelta) * 100)}%` }}
                            />
                          </span>
                          <span
                            className={`stat-mono flex shrink-0 items-center gap-1 text-[15px] whitespace-nowrap ${
                              row.delta >= 0 ? "text-zest2" : "text-blush"
                            }`}
                          >
                            <PushGlyph className="h-3.5 w-3.5" />
                            {row.delta >= 0 ? "+" : ""}
                            {formatNumber(row.delta)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
