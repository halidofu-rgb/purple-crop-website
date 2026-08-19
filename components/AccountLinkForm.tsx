"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { Link2, RefreshCw } from "lucide-react";

export default function AccountLinkForm({
  existingTag,
  existingRankedScore,
}: {
  existingTag?: string;
  existingRankedScore?: number;
}) {
  const router = useRouter();
  const [tag, setTag] = useState(existingTag ?? "");
  const [rankedScore, setRankedScore] = useState(
    existingRankedScore !== undefined ? String(existingRankedScore) : ""
  );
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
        body: JSON.stringify({ tag, rankedScore }),
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
      </div>

      <div>
        <label className="mb-1.5 block font-display text-xs uppercase tracking-wide text-ash">
          Score Ranked actuel (optionnel)
        </label>
        <input
          value={rankedScore}
          onChange={(e) => setRankedScore(e.target.value)}
          placeholder="ex : 6600"
          inputMode="numeric"
          className="w-full rounded-xl border border-line bg-panel2 px-4 py-2.5 text-sm text-white placeholder:text-ash focus:border-zest focus:outline-none"
        />
        <p className="mt-1.5 text-[11px] text-ash">
          Visible dans ton profil en jeu. On ne peut pas le récupérer automatiquement (l&apos;API
          Brawl Stars ne le fournit pas) — c&apos;est ce chiffre qui sert de point de départ pour
          calculer ta progression ensuite.
        </p>
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
