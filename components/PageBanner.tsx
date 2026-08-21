// Bannière de page — la signature de la charte : fond `section` en dégradé,
// grille verticale, halo violet, titre display à gauche, chiffres à droite.
// Utilisée par /classement et /actualites (et réutilisable ailleurs).
import type { ReactNode } from "react";

export interface BannerStat {
  value: ReactNode;
  label: string;
}

export default function PageBanner({
  kicker,
  title,
  intro,
  stats,
  flush,
}: {
  kicker: string;
  title: ReactNode;
  intro?: string;
  stats?: BannerStat[];
  /** true quand un bloc (onglets…) vient se coller dessous : pas d'arrondi bas. */
  flush?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden border-x border-b border-paper/10 bg-[linear-gradient(160deg,#262a60_0%,#1b1d33_48%,#161826_100%)] ${
        flush ? "" : "rounded-b-2xl"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 bg-[linear-gradient(90deg,rgba(233,233,237,0.06)_1px,transparent_1px)] bg-[length:64px_64px]" />
      <div className="pointer-events-none absolute -top-[150px] -right-[90px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(181,171,252,0.2),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-[72%] w-px -skew-x-12 bg-gradient-to-b from-zest2/45 to-transparent" />

      <div className="relative grid items-end gap-10 px-6 pt-14 pb-9 sm:px-10 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="mb-3.5 text-[11.5px] uppercase tracking-[0.16em] text-zest2">{kicker}</p>
          <h1 className="font-display text-[clamp(40px,5.4vw,72px)] font-medium uppercase leading-[0.94] tracking-[-0.035em] text-paper">
            {title}
          </h1>
          {intro && (
            <p className="mt-4 max-w-[520px] text-base leading-relaxed text-steel-400">{intro}</p>
          )}
        </div>

        {stats && stats.length > 0 && (
          <dl className="flex lg:justify-self-end">
            {stats.map((s, i) => (
              <div key={s.label} className={i === 0 ? "pr-6" : "border-l border-paper/15 pl-6"}>
                <dd className="whitespace-nowrap text-[34px] leading-none tracking-[-0.02em] text-paper">
                  {s.value}
                </dd>
                <dt className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-ash">{s.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
