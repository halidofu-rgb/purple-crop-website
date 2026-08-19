"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { Link2, RefreshCw } from "lucide-react";

export default function AccountLinkForm({
  existingTag,
  existingRankedScore,
  existingRankedBest,
}: {
  existingTag?: string;
  existingRankedScore?: number;
  existingRankedBest?: number;
}) {
  const router = useRouter();
  const [tag, setTag] = useState(existingTag ?? "");
  const [rankedScore, setRankedScore] = useState(
    existingRankedScore !== undefined ? String(existingRankedScore) : ""
  );
  const [rankedBest, setRankedBest] = useState(
    existingRankedBest !== undefined ? String(existingRankedBest) : ""
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
        body: JSON.stringify({ tag, rankedScore, rankedBest }),
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block font-display text-xs uppercase tracking-wide text-ash">
            Ranked actuel
          </label>
          <input
            value={rankedScore}
            onChange={(e) => setRankedScore(e.target.value)}
            placeholder="ex : 5564"
            inputMode="numeric"
            className="w-full rounded-xl border border-line bg-panel2 px-4 py-2.5 text-sm text-white placeholder:text-ash focus:border-zest focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-display text-xs uppercase tracking-wide text-ash">
            Ranked all-time
          </label>
          <input
            value={rankedBest}
            onChange={(e) => setRankedBest(e.target.value)}
            placeholder="ex : 6319"
            inputMode="numeric"
            className="w-full rounded-xl border border-line bg-panel2 px-4 py-2.5 text-sm text-white placeholder:text-ash focus:border-zest focus:outline-none"
          />
        </div>
      </div>
      <p className="text-[11px] text-ash">
        Les deux sont visibles dans ton profil en jeu. L&apos;API Brawl Stars ne les fournit pas,
        donc c&apos;est à toi de les indiquer — reviens les mettre à jour de temps en temps.
      </p>

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
