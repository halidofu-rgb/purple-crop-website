import type { Metadata } from "next";
import { Inter, Chakra_Petch, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

// Chakra Petch (plus anguleuse, style esport) pour les titres — Inter reste
// la police de corps. C'était l'intention d'origine (voir globals.css,
// --font-display), jamais vraiment branchée jusqu'ici.
const display = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
});
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const SITE_URL = process.env.NEXTAUTH_URL || "https://purple-corp-website.vercel.app";
const TITLE = "Purple Corp — Brawl Stars";
const DESCRIPTION = "Le classement et les stats de Purple Corp, en direct.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Purple Corp",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
        <Analytics />
      </body>
    </html>
  );
}
