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

export default function NewsPostCard({
  post,
  canDelete,
}: {
  post: NewsPost;
  canDelete: boolean;
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

  return (
    <article className="rounded-2xl border border-paper/10 bg-panel p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.14em] uppercase text-steel-500">
            {formatDate(post.createdAt)}
          </p>
          <h2 className="mt-1 text-xl tracking-[-0.01em] text-paper">{post.title}</h2>
        </div>
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="shrink-0 rounded-lg border border-paper/10 p-2 text-steel-500 transition hover:border-blush/40 hover:text-blush disabled:opacity-50"
            aria-label="Supprimer cette actualité"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      {post.imageUrl && (
        <div className="mt-4">
          <NewsImage src={post.imageUrl} alt="" />
        </div>
      )}
      <p className="mt-4 whitespace-pre-wrap text-[14.5px] leading-relaxed text-steel-300">
        {post.body}
      </p>
    </article>
  );
}
