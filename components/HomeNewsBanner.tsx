"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Megaphone } from "lucide-react";
import NewsImage from "@/components/NewsImage";
import type { NewsPost } from "@/lib/news";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Encart d'accueil pour la dernière actualité — replié par défaut (juste le
// titre) pour ne pas bouffer toute la page, se déplie au clic pour le
// contenu complet. Objectif : que le challenge en cours soit visible d'un
// coup d'œil, sans forcer la lecture ni prendre toute la home.
export default function HomeNewsBanner({ post }: { post: NewsPost }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-zest2/35 bg-gradient-to-br from-iris/40 to-panel/90">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left sm:px-7"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zest2/15 text-zest2">
          <Megaphone className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] uppercase tracking-[0.14em] text-zest2">
            Dernière actualité — {formatDate(post.createdAt)}
          </p>
          <p className="mt-0.5 truncate text-[15px] font-medium text-paper sm:text-base">
            {post.title}
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-steel-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-paper/10 px-5 pb-6 pt-5 sm:px-7">
          {post.imageUrl && (
            <div className="mb-4 bg-void2">
              <NewsImage src={post.imageUrl} alt="" />
            </div>
          )}
          <p className="max-w-[62ch] whitespace-pre-wrap text-[14px] leading-relaxed text-steel-400">
            {post.body}
          </p>
          <Link
            href="/actualites"
            className="mt-4 inline-block text-xs uppercase tracking-[0.12em] text-zest2 transition hover:text-paper"
          >
            Toutes les actualités →
          </Link>
        </div>
      )}
    </section>
  );
}
