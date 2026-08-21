import Link from "next/link";
import { getClub } from "@/lib/brawlstars";
import { clubTags } from "@/lib/clubs";
import { PURPLE_CORP_DISCORD_URL } from "@/lib/site";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserPlus, Flag, Bug, MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const TOPICS = [
  {
    title: "Candidature",
    body: "Tu veux rejoindre Purple Line, Indigo Line ou Iris Line ? Passe sur le Discord, le recrutement s'y fait en direct.",
    cta: "Postuler",
    href: PURPLE_CORP_DISCORD_URL,
    icon: UserPlus,
    primary: true,
  },
  {
    title: "Signalement",
    body: "Comportement toxique, triche suspectée, litige entre membres : préviens le staff sur le Discord.",
    cta: "Signaler",
    href: PURPLE_CORP_DISCORD_URL,
    icon: Flag,
  },
  {
    title: "Bug sur le site",
    body: "Une donnée qui semble fausse, une page cassée ? Décris-le sur le Discord, on corrige au plus vite.",
    cta: "Signaler un bug",
    href: PURPLE_CORP_DISCORD_URL,
    icon: Bug,
  },
];

const FAQS = [
  {
    q: "Pourquoi un joueur n'a pas de rang Ranked affiché ?",
    a: "Le Ranked (rang, Elo, record) n'apparaît que pour les joueurs ayant débloqué le mode (1 000 trophées) et joué au moins un combat Ranked.",
  },
  {
    q: "Le push d'un joueur affiche 0, pourquoi ?",
    a: "Le push se calcule depuis le début de la saison. S'il vient d'être suivi pour la première fois, le compteur redémarre logiquement à zéro.",
  },
  {
    q: "Comment lier mon compte Discord à mon tag Brawl Stars ?",
    a: "Connecte-toi avec Discord (bouton en haut à droite), puis va sur /compte pour renseigner ton tag et une présentation.",
  },
  {
    q: "Comment rejoindre un club Purple Corp ?",
    a: "Passe sur le Discord de Purple Corp — le recrutement de nos clubs s'y fait directement, en fonction des places disponibles.",
  },
];

export default async function SupportPage() {
  const tags = clubTags();
  const clubs = await Promise.all(
    tags.map(async (tag) => {
      try {
        return await getClub(tag);
      } catch {
        return null;
      }
    })
  );
  const loadedClubs = clubs.filter((c): c is NonNullable<typeof c> => c !== null);
  const totalMembers = loadedClubs.reduce((sum, c) => sum + c.members.length, 0);
  const staffCount = loadedClubs.reduce(
    (sum, c) =>
      sum +
      c.members.filter((m) => m.role === "president" || m.role === "vicePresident" || m.role === "senior")
        .length,
    0
  );

  return (
    <>
      <Navbar />
      <main className="animate-fadeInUp">
        {/* bannière */}
        <section className="relative overflow-hidden border-b border-paper/10 px-4 sm:px-8 lg:px-12">
          <div className="pointer-events-none absolute inset-0 opacity-40 bg-[linear-gradient(90deg,rgba(233,233,237,0.06)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="pointer-events-none absolute -right-20 -top-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(181,171,252,0.2),transparent_65%)]" />
          <div className="relative mx-auto grid max-w-[1200px] items-end gap-8 py-14 sm:py-16 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="mb-3 text-[11.5px] tracking-[0.16em] uppercase text-zest2">
                Support &amp; staff
              </p>
              <h1 className="font-display text-4xl leading-[0.95] font-medium tracking-[-0.03em] uppercase text-paper lg:text-[64px]">
                On répond
                <br />
                sur le Discord
              </h1>
              <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-steel-400">
                Candidature, litige entre membres, trophées qui semblent faux, comportement
                toxique : le staff Purple Corp traite chaque demande sur le Discord.
              </p>
            </div>
            <dl className="flex justify-self-start border-t border-paper/10 pt-5 lg:justify-self-end">
              <div className="pr-6">
                <dd className="stat-mono text-4xl leading-none tracking-[-0.02em] text-paper">
                  {staffCount}
                </dd>
                <dt className="mt-1.5 text-[11px] tracking-[0.14em] uppercase text-steel-500">
                  Responsables de club
                </dt>
              </div>
              <div className="border-l border-paper/15 pl-6">
                <dd className="stat-mono text-4xl leading-none tracking-[-0.02em] text-paper">
                  {totalMembers}
                </dd>
                <dt className="mt-1.5 text-[11px] tracking-[0.14em] uppercase text-steel-500">
                  Membres actifs
                </dt>
              </div>
            </dl>
          </div>
        </section>

        <div className="px-4 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1200px]">
            {/* motifs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TOPICS.map((t) => {
                const Icon = t.icon;
                return (
                  <a
                    key={t.title}
                    href={t.href}
                    className={`block rounded-2xl p-6 transition ${
                      t.primary
                        ? "border border-zest2/35 bg-gradient-to-br from-iris/50 to-panel/90 hover:border-zest2/60"
                        : "border border-paper/10 bg-panel hover:border-paper/25"
                    }`}
                  >
                    <span
                      className={`mb-6 flex h-9 w-9 items-center justify-center rounded-lg ${
                        t.primary
                          ? "bg-gradient-to-br from-zest2 to-iris shadow-[0_0_20px_rgba(181,171,252,0.45)]"
                          : "bg-gradient-to-br from-zest to-iris"
                      }`}
                    >
                      <Icon className="h-4 w-4 text-ink" />
                    </span>
                    <h2 className="text-[19px] tracking-[-0.01em] text-paper">{t.title}</h2>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-steel-400">{t.body}</p>
                    <p
                      className={`mt-5 text-[11px] tracking-[0.14em] uppercase ${
                        t.primary ? "text-zest2" : "text-steel-400"
                      }`}
                    >
                      {t.cta} →
                    </p>
                  </a>
                );
              })}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {/* FAQ — <details> : accordéon sans JS */}
              <div className="rounded-2xl border border-paper/10 bg-panel p-6 sm:p-7">
                <h2 className="mb-4 text-[11px] tracking-[0.16em] uppercase text-steel-500">
                  Questions fréquentes
                </h2>
                <div className="flex flex-col">
                  {FAQS.map((f, i) => (
                    <details
                      key={f.q}
                      open={i === 0}
                      className="group border-t border-paper/[0.08] py-4 first:border-none"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14.5px] font-medium text-paper marker:content-none">
                        {f.q}
                        <span className="shrink-0 text-lg leading-none text-steel-600 group-open:text-zest2">
                          <span className="group-open:hidden">+</span>
                          <span className="hidden group-open:inline">−</span>
                        </span>
                      </summary>
                      <p className="mt-3 text-[13.5px] leading-relaxed text-steel-400">{f.a}</p>
                    </details>
                  ))}
                </div>
              </div>

              {/* Discord */}
              <div className="flex flex-col justify-center gap-4 rounded-2xl border border-zest2/30 bg-gradient-to-br from-iris/45 to-panel/70 px-6 py-7 text-center sm:px-8">
                <MessageCircle className="mx-auto h-7 w-7 text-zest2" />
                <div>
                  <p className="text-[11px] tracking-[0.16em] uppercase text-zest2">
                    Le plus rapide
                  </p>
                  <p className="mt-1 text-xl tracking-[-0.01em] text-paper">
                    Discord Purple Corp
                  </p>
                  <p className="mt-1 text-[13px] text-steel-400">
                    Candidatures, signalements, questions — tout se passe là-bas.
                  </p>
                </div>
                <Link
                  href={PURPLE_CORP_DISCORD_URL}
                  className="mx-auto rounded-lg border border-zest bg-zest/10 px-6 py-3 text-[12.5px] tracking-[0.12em] uppercase text-zest2 transition-colors hover:bg-zest/25 active:bg-zest/35"
                >
                  Rejoindre le Discord
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
