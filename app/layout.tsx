import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Purple Corp", description: "x" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="fr"><body>{children}</body></html>);
}
