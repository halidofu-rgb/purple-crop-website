"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shield, Trophy, TrendingUp, LifeBuoy } from "lucide-react";

const LINKS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/clubs", label: "Clubs", icon: Shield },
  { href: "/classement", label: "Classement", icon: Trophy },
  { href: "/pusheurs", label: "Pusheurs", icon: TrendingUp },
  { href: "/support", label: "Support", icon: LifeBuoy },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 rounded-lg" />
          <span className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-white">
            Purple Corp
          </span>
        </Link>
        <nav className="flex gap-1 sm:gap-2">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-xs uppercase tracking-[0.1em] transition-all sm:px-4 sm:text-sm ${
                  active
                    ? "bg-panel2 text-white shadow-[inset_0_0_0_1px_rgba(159,122,234,0.4)]"
                    : "text-ash hover:bg-panel2/60 hover:text-white"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "text-signal" : ""}`} />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
