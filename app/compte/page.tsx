import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMemberLink } from "@/lib/members";
import { getPlayer, getBattleLog, parseBattleTime } from "@/lib/brawlstars";
import Navbar from "@/components/Navbar";
import AccountLinkForm from "@/components/AccountLinkForm";
import Button from "@/components/Button";
import RankGlyph from "@/components/RankGlyph";
import { LogIn } from "lucide-react";

export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

export default async function ComptePage() {
  const session = await getServerSession(authOptions);
  const discordId = (session?.user as { id?: string } | undefined)?.id;

  if (!session || !discordId) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[70vh] items-center justify-center px-6 text-center">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Connecte-toi pour continuer
            </h1>
            <p className="mt-2 max-w-sm text-sm text-ash">
              Lie ton compte Discord à ton tag Brawl Stars pour débloquer une estimation Ranked
              précise et personnalisée.
            </p>
            <div className="mt-5 flex justify-center">
              <Button href="/api/auth/signin/discord" icon={<LogIn className="h-4 w-4" />}>
                Se connecter avec Discord
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  const link = await getMemberLink(discordId).catch(() => null);

  let rankedEstimate: number | null = null;
  let player = null;
  if (link) {
    try {
      player = await getPlayer(link.tag);
    } catch {
      player = null;
    }

    if (link.rankedScore !== undefined && link.rankedUpdatedAt) {
      try {
        const battles = await getBattleLog(link.tag);
        const since = new Date(link.rankedUpdatedAt);
        const delta = battles
          .filter((b) => b.battle.type?.toLowerCase().includes("ranked"))
          .filter((b) => parseBattleTime(b.battleTime) > since)
          .reduce((sum, b) => sum + (b.battle.trophyChange ?? 0), 0);
        rankedEstimate = link.rankedScore + delta;
      } catch {
        rankedEstimate = link.rankedScore;
      }
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen animate-fadeInUp px-4 py-10 sm:px-8 lg:px-16">
        <section className="mx-auto max-w-lg text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-signal">
            Mon compte
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-white">
            Salut {session.user?.name}
          </h1>
        </section>

        {link && player && (
          <section className="hud-frame mx-auto mt-8 max-w-lg bg-panel px-6 py-6 text-center">
            <p className="font-display text-sm font-semibold text-white">{player.name}</p>
            <p className="mt-1 font-mono text-xs text-ash">#{link.tag}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <p className="stat-mono text-xl font-semibold text-zest">
                  {formatNumber(player.trophies)}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ash">Trophées</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-1 stat-mono text-xl font-semibold text-signal">
                  <RankGlyph className="h-4 w-4" />
                  {rankedEstimate !== null ? formatNumber(rankedEstimate) : "—"}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ash">
                  Ranked (estimé)
                </p>
              </div>
            </div>
            {rankedEstimate !== null && (
              <p className="mt-4 text-[11px] text-ash">
                Basé sur ta dernière saisie + les combats Ranked joués depuis. Ressaisis ton score
                de temps en temps pour rester précis.
              </p>
            )}
          </section>
        )}

        <section className="mx-auto mt-8 max-w-lg rounded-2xl border border-line bg-panel p-6">
          <h2 className="mb-4 font-display text-sm font-semibold text-white">
            {link ? "Modifier ma liaison" : "Lier mon compte Brawl Stars"}
          </h2>
          <AccountLinkForm existingTag={link?.tag} existingRankedScore={link?.rankedScore} />
        </section>
      </main>
    </>
  );
}
