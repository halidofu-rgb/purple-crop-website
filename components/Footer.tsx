import Link from "next/link";
import Image from "next/image";
import { PURPLE_CORP_DISCORD_URL } from "@/lib/site";
import { MessageCircle } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-paper/10">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7 rounded-lg" />
              <span className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-paper">
                Purple Corp
              </span>
            </div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-ash">
              Structure de clubs Brawl Stars compétitive : Purple Line, Indigo Line et Iris Line,
              réunis autour de la performance et de la progression.
            </p>
          </div>

          <div>
            <p className="font-display text-xs uppercase tracking-[0.2em] text-ash">Navigation</p>
            <ul className="mt-3 space-y-2 text-xs text-ash">
              <li><Link href="/clubs" className="hover:text-paper">Clubs</Link></li>
              <li><Link href="/classement" className="hover:text-paper">Classement</Link></li>
              <li><Link href="/pusheurs" className="hover:text-paper">Pusheurs</Link></li>
              <li><Link href="/actualites" className="hover:text-paper">Actualités</Link></li>
              <li><Link href="/saisons" className="hover:text-paper">Saisons passées</Link></li>
              <li><Link href="/support" className="hover:text-paper">Support</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-display text-xs uppercase tracking-[0.2em] text-ash">Communauté</p>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-ash">
              Discussions, recrutement, annonces de nos clubs.
            </p>
            <Link
              href={PURPLE_CORP_DISCORD_URL}
              className="mt-3 inline-flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-[0.1em] text-signal hover:underline"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Rejoindre le Discord
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-1 border-t border-paper/10 pt-6 text-center">
          <p className="font-display text-[10px] uppercase tracking-[0.3em] text-ash">
            Performance · Communauté · Progression
          </p>
          <p className="text-[11px] text-ash">© {year} Purple Corp — Communauté Brawl Stars.</p>
        </div>
      </div>
    </footer>
  );
}
