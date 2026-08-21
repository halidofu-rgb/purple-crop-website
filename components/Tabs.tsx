"use client";

import { useState, ReactNode } from "react";

export interface TabDef {
  id: string;
  label: string;
  icon?: ReactNode;
  panel: ReactNode;
}

// Onglets en soulignement (charte : pas de pilule pleine, l'accent est une
// ligne).
//   `attached` → barre collée sous une PageBanner flush, panneau détaché en dessous.
//   `seamless` → barre ET panneau collés à la bannière : un seul bloc continu
//                (les panneaux doivent alors être en `rounded-b-2xl border-t-0`).
export default function Tabs({
  tabs,
  defaultTab,
  attached,
  seamless,
}: {
  tabs: TabDef[];
  defaultTab?: string;
  attached?: boolean;
  seamless?: boolean;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  const barClass = seamless
    ? "overflow-x-auto border-x border-b border-paper/10 bg-void2/60 px-3 sm:px-7"
    : attached
      ? "overflow-x-auto rounded-b-2xl border-x border-b border-paper/10 bg-void2/60 px-3 sm:px-7"
      : "mb-4 overflow-x-auto border-b border-paper/10";

  return (
    <div>
      <div className={barClass}>
        <div className="flex gap-0.5">
          {tabs.map((tab) => {
            const isActive = tab.id === current?.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3.5 text-[12.5px] uppercase tracking-[0.12em] transition ${
                  isActive
                    ? "border-zest2 text-paper"
                    : "border-transparent text-steel-600 hover:text-steel-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className={seamless ? "" : attached ? "mt-4" : ""}>{current?.panel}</div>
    </div>
  );
}
