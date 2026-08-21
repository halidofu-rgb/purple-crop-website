"use client";

import { useState, ReactNode } from "react";

export interface TabDef {
  id: string;
  label: string;
  icon?: ReactNode;
  panel: ReactNode;
}

export default function Tabs({ tabs, defaultTab }: { tabs: TabDef[]; defaultTab?: string }) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div className="mb-4 overflow-x-auto">
        <div className="inline-flex gap-1 rounded-full border border-paper/10 bg-panel p-1">
          {tabs.map((tab) => {
            const isActive = tab.id === current?.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-[12.5px] uppercase tracking-[0.1em] transition ${
                  isActive ? "bg-zest text-ink" : "text-steel-400 hover:text-paper"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      {current?.panel}
    </div>
  );
}
