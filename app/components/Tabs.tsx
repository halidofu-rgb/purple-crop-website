"use client";

import { useState, ReactNode } from "react";

export interface TabDef {
  id: string;
  label: string;
  icon?: ReactNode;
  panel: ReactNode;
}

export default function Tabs({ tabs }: { tabs: TabDef[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div className="mb-4 inline-flex gap-1 rounded-full border border-line bg-panel p-1">
        {tabs.map((tab) => {
          const isActive = tab.id === current?.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-display text-xs uppercase tracking-[0.1em] transition ${
                isActive ? "bg-zest text-ink" : "text-ash hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
      {current?.panel}
    </div>
  );
}
