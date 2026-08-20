"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { Link2, RefreshCw } from "lucide-react";

export default function AccountLinkForm({
  existingTag,
  existingBio,
}: {
  existingTag?: string;
  existingBio?: string;
}) {
  const router = useRouter();
  const [tag, setTag] = useState(existingTag ?? "");
  const [bio, setBio] = useState(existingBio ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/compte/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag, bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setSuccess(true);
        router.refresh();
      }
    } catch {
      setError("Une erreur réseau est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block font-display text-xs uppercase tracking-wide text-ash">
          Tag Brawl Stars
        </label>
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="#TAG ou TAG"
          required
          className="w-full rounded-xl border border-line bg-panel2 px-4 py-2.5 text-sm text-white placeholder:text-ash focus:border-zest focus:outline-none"
        />
        <p className="mt-1.5 text-[11px] text-ash">
          Ton Ranked actuel et all-time sont suivis automatiquement dès que ton club est
          synchronisé — rien d&apos;autre à saisir.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block font-display text-xs uppercase tracking-wide text-ash">
          Présentation (optionnel)
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Une phrase sur toi, ton style de jeu, tes objectifs..."
          maxLength={200}
          rows={3}
          className="w-full resize-none rounded-xl border border-line bg-panel2 px-4 py-2.5 text-sm text-white placeholder:text-ash focus:border-zest focus:outline-none"
        />
      </div>

      {error && <p className="text-xs text-blush">{error}</p>}
      {success && <p className="text-xs text-signal">Compte lié avec succès.</p>}

      <Button
        variant="primary"
        icon={existingTag ? <RefreshCw className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        className="w-full justify-center"
      >
        {loading ? "..." : existingTag ? "Mettre à jour" : "Lier mon compte"}
      </Button>
    </form>
  );
}
