import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMemberLink } from "@/lib/members";
import { getPlayer } from "@/lib/brawlstars";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
            <h1 className="text-2xl font-bold text-paper">
              Connecte-toi pour continuer
            </h1>
            <p className="mt-2 max-w-sm text-sm text-steel-400">
              Lie ton compte Discord à ton tag Brawl Stars pour ajouter une présentation et
              retrouver ta fiche facilement.
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

  let player = null;
  if (link) {
    try {
      player = await getPlayer(link.tag);
    } catch {
      player = null;
    }
  }
  const hasRanked = typeof player?.rankedElo === "number";

  return (
    <>
      <Navbar />
      <main className="min-h-screen animate-fadeInUp px-4 py-10 sm:px-8 lg:px-16">
        <section className="mx-auto max-w-lg text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-signal">
            Mon compte
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-paper">
            Salut {session.user?.name}
          </h1>
        </section>

        {link && player && (
          <section className="relative mx-auto mt-8 max-w-lg overflow-hidden rounded-2xl border border-zest2/25 bg-panel px-6 py-6 text-center">
            <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(181,171,252,0.18),transparent_65%)]" />
            <p className="relative text-sm font-semibold text-paper">{player.name}</p>
            <p className="relative mt-1 font-mono text-xs text-steel-400">#{link.tag}</p>
            <div className="relative mt-5 grid grid-cols-3 gap-3">
              <div>
                <p className="stat-mono text-lg font-semibold text-zest">
                  {formatNumber(player.trophies)}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-steel-400">Trophées</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-1 stat-mono text-lg font-semibold text-signal">
                  <RankGlyph className="h-3.5 w-3.5" />
                  {hasRanked ? formatNumber(player!.rankedElo!) : "—"}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-steel-400">Ranked</p>
              </div>
              <div>
                <p className="stat-mono text-lg font-semibold text-zest2">
                  {hasRanked ? formatNumber(player!.highestAllTimeRankedElo ?? player!.rankedElo!) : "—"}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-steel-400">
                  Ranked all-time
                </p>
              </div>
            </div>
            {!hasRanked && (
              <p className="mt-4 text-[11px] text-steel-400">
                Pas encore de rang Ranked sur ce compte (débloqué à 1 000 trophées, puis un
                premier combat Ranked joué).
              </p>
            )}
          </section>
        )}

        <section className="mx-auto mt-8 max-w-lg rounded-2xl border border-paper/10 bg-panel p-6">
          <h2 className="mb-4 text-sm font-semibold text-paper">
            {link ? "Modifier ma liaison" : "Lier mon compte Brawl Stars"}
          </h2>
          <AccountLinkForm existingTag={link?.tag} existingBio={link?.bio} />
        </section>
      </main>
      <Footer />
    </>
  );
}
