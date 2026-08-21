"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import NewsImage from "@/components/NewsImage";
import type { NewsPost } from "@/lib/news";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Deux traitements : `featured` = la une (image à gauche, texte à droite, la
// seule carte de la page qui porte la lueur violette), sinon carte de fil
// (image en tête, texte dessous) dans une grille.
export default function NewsPostCard({
  post,
  canDelete,
  featured,
}: {
  post: NewsPost;
  canDelete: boolean;
  featured?: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Supprimer « ${post.title} » ?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/actualites/${post.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  const deleteButton = canDelete && (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="shrink-0 rounded-lg border border-paper/10 p-2 text-steel-500 transition hover:border-blush/40 hover:text-blush disabled:opacity-50"
      aria-label="Supprimer cette actualité"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );

  if (featured) {
    return (
      <article className="relative grid overflow-hidden rounded-2xl border border-zest2/35 bg-gradient-to-br from-iris/45 to-panel/90 lg:grid-cols-2">
        {post.imageUrl && (
          <div className="min-h-[240px] bg-void2">
            <NewsImage src={post.imageUrl} alt="" />
          </div>
        )}
        <div className="flex flex-col justify-center gap-4 px-7 py-8 sm:px-9">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md border border-zest2/45 bg-iris/55 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.14em] text-zest2">
                À la une
              </span>
              <span className="stat-mono text-[11.5px] uppercase tracking-[0.06em] text-steel-600">
                {formatDate(post.createdAt)}
              </span>
            </div>
            {deleteButton}
          </div>
          <h2 className="font-display text-[clamp(26px,2.8vw,38px)] font-medium leading-[1.05] tracking-[-0.025em] text-paper">
            {post.title}
          </h2>
          <p className="max-w-[52ch] whitespace-pre-wrap text-[15px] leading-relaxed text-steel-400">
            {post.body}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-paper/10 bg-panel">
      {post.imageUrl && (
        <div className="border-b border-paper/[0.08] bg-void2">
          <NewsImage src={post.imageUrl} alt="" />
        </div>
      )}
      <div className="flex flex-1 flex-col px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <span className="stat-mono text-[11px] uppercase tracking-[0.06em] text-steel-600">
            {formatDate(post.createdAt)}
          </span>
          {deleteButton}
        </div>
        <h2 className="mt-2 text-[19px] font-medium leading-tight tracking-[-0.015em] text-paper">
          {post.title}
        </h2>
        <p className="mt-2.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-steel-400">
          {post.body}
        </p>
      </div>
    </article>
  );
}
