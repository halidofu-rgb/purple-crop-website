import type { Metadata } from "next";
import { Rubik, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Rubik({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Notre club — Brawl Stars",
  description: "Le classement et les stats de notre club Brawl Stars, en direct.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
