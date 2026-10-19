"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export default function SessionProviderWrapper({ children }: { children: ReactNode }) {
  // refetchOnWindowFocus={false} : sinon chaque retour sur l'onglet relance
  // un appel /api/auth/session (une invocation de fonction Vercel de plus).
  return <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>;
}
