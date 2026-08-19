"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/clubs", label: "Clubs" },
  { href: "/classement", label: "Classement" },
  { href: "/pusheurs", label: "Pusheurs" },
  { href: "/support", label: "Support" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={30} height={30} className="h-[30px] w-[30px]" />
          <span className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-white">
            Purple Corp
          </span>
        </Link>
        <nav className="flex gap-5 sm:gap-8">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative pb-1 font-display text-xs uppercase tracking-[0.15em] transition-colors sm:text-sm ${
                  active ? "text-white" : "text-ash hover:text-white"
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute -bottom-[1px] left-0 h-[2px] w-full bg-signal" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
