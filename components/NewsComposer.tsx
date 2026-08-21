"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import Button from "@/components/Button";

export default function NewsComposer() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/actualites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setTitle("");
        setBody("");
        setImageUrl("");
        router.refresh();
      }
    } catch {
      setError("Une erreur réseau est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zest2/30 bg-gradient-to-br from-iris/40 to-panel/90 p-6"
    >
      <p className="mb-4 text-[11px] tracking-[0.16em] uppercase text-zest2">
        Publier une actualité
      </p>
      <div className="flex flex-col gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre"
          required
          maxLength={120}
          className="w-full rounded-xl border border-paper/10 bg-panel2 px-4 py-2.5 text-sm text-paper placeholder:text-steel-400 focus:border-zest focus:outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Le texte de l'actualité..."
          required
          rows={5}
          maxLength={4000}
          className="w-full resize-y rounded-xl border border-paper/10 bg-panel2 px-4 py-2.5 text-sm text-paper placeholder:text-steel-400 focus:border-zest focus:outline-none"
        />
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Image (URL, optionnel)"
          className="w-full rounded-xl border border-paper/10 bg-panel2 px-4 py-2.5 text-sm text-paper placeholder:text-steel-400 focus:border-zest focus:outline-none"
        />

        {error && <p className="text-xs text-blush">{error}</p>}

        <Button
          variant="primary"
          icon={<Send className="h-4 w-4" />}
          className="w-full justify-center sm:w-auto sm:self-start"
        >
          {loading ? "Publication..." : "Publier"}
        </Button>
      </div>
    </form>
  );
}
