import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMemberLink } from "@/lib/members";
import { getPlayer } from "@/lib/brawlstars";
import Navbar from "@/components/Navbar";
import AccountLinkForm from "@/components/AccountLinkForm";
import Button from "@/components/Button";
import RankGlyph from "@/components/RankGlyph";
import { LogIn } from "lucide-react";

export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
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
              Lie ton compte Discord à ton tag Brawl Stars pour afficher ton Ranked actuel et ton
              record all-time sur le site.
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
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div>
                <p className="stat-mono text-lg font-semibold text-zest">
                  {formatNumber(player.trophies)}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ash">Trophées</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-1 stat-mono text-lg font-semibold text-signal">
                  <RankGlyph className="h-3.5 w-3.5" />
                  {link.rankedScore !== undefined ? formatNumber(link.rankedScore) : "—"}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ash">Ranked</p>
              </div>
              <div>
                <p className="stat-mono text-lg font-semibold text-zest2">
                  {link.rankedBest !== undefined ? formatNumber(link.rankedBest) : "—"}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ash">
                  Ranked all-time
                </p>
              </div>
            </div>
            {link.rankedUpdatedAt && (
              <p className="mt-4 text-[11px] text-ash">
                Ranked mis à jour le {formatDate(link.rankedUpdatedAt)} — pense à revenir le
                mettre à jour de temps en temps.
              </p>
            )}
          </section>
        )}

        <section className="mx-auto mt-8 max-w-lg rounded-2xl border border-line bg-panel p-6">
          <h2 className="mb-4 font-display text-sm font-semibold text-white">
            {link ? "Modifier ma liaison" : "Lier mon compte Brawl Stars"}
          </h2>
          <AccountLinkForm
            existingTag={link?.tag}
            existingRankedScore={link?.rankedScore}
            existingRankedBest={link?.rankedBest}
            existingBio={link?.bio}
          />
        </section>
      </main>
    </>
  );
}
