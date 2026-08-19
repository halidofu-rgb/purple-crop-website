import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import { PURPLE_CORP_DISCORD_URL } from "@/lib/site";
import { MessageCircle, HelpCircle } from "lucide-react";

export default function SupportPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen animate-fadeInUp px-4 py-10 sm:px-8 lg:px-16">
        <section className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-signal">
            Besoin d&apos;aide ?
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Support
          </h1>
          <p className="mt-4 text-sm text-ash">
            Une question, un souci sur le site, ou tu veux rejoindre un club ? Le plus rapide,
            c&apos;est de passer sur le Discord.
          </p>
          <div className="mt-6">
            <Button href={PURPLE_CORP_DISCORD_URL} variant="primary" size="lg" icon={<MessageCircle className="h-4 w-4" />}>
              Rejoindre le Discord
            </Button>
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-2xl space-y-4">
          <div className="card-lift flex items-start gap-3 rounded-2xl border border-line bg-panel p-5">
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-zest" />
            <div>
              <p className="font-display text-sm font-semibold text-white">
                Pourquoi certaines données Ranked manquent ?
              </p>
              <p className="mt-1 text-sm text-ash">
                L&apos;API officielle de Brawl Stars ne donne pas de rang Ranked absolu (Masters,
                Légendaire...). On affiche uniquement l&apos;évolution sur les 25 derniers combats,
                seule donnée réellement disponible.
              </p>
            </div>
          </div>
          <div className="card-lift flex items-start gap-3 rounded-2xl border border-line bg-panel p-5">
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-zest" />
            <div>
              <p className="font-display text-sm font-semibold text-white">
                Le push d&apos;un joueur affiche 0, pourquoi ?
              </p>
              <p className="mt-1 text-sm text-ash">
                Le push se calcule depuis le début de la saison. S&apos;il vient d&apos;être suivi
                pour la première fois, le compteur redémarre logiquement à zéro.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
