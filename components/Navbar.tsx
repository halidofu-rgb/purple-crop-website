"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { LogIn, User } from "lucide-react";
import SearchBox from "@/components/SearchBox";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/clubs", label: "Clubs" },
  { href: "/classement", label: "Classement" },
  { href: "/pusheurs", label: "Pusheurs" },
  { href: "/actualites", label: "Actualités" },
  { href: "/support", label: "Support" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-6 gap-y-2.5 border-b border-paper/10 bg-ink/80 px-4 py-3.5 backdrop-blur-lg sm:px-8 lg:px-12">
      <Link href="/" className="mr-2 flex shrink-0 items-center gap-2.5 whitespace-nowrap">
        <Image src="/logo.png" alt="" width={30} height={30} className="h-[30px] w-[30px]" />
        <span className="text-[15px] tracking-[0.16em] uppercase text-paper">
          Purple <span className="text-zest">Corp</span>
        </span>
      </Link>

      <nav className="flex min-w-0 flex-wrap gap-x-5 gap-y-2 text-[12.5px] tracking-[0.12em] uppercase">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors hover:text-paper ${active ? "text-paper" : "text-steel-400"}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <SearchBox />
        {status === "authenticated" ? (
          <Link
            href="/compte"
            className="flex items-center gap-1.5 rounded-lg border border-zest/40 px-4 py-2 text-[12.5px] tracking-[0.1em] uppercase text-zest2 transition-colors hover:bg-zest/15"
          >
            {session.user?.image ? (
              <img src={session.user.image} alt="" className="h-4 w-4 rounded-full" />
            ) : (
              <User className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{session.user?.name ?? "Mon compte"}</span>
          </Link>
        ) : (
          <button
            onClick={() => signIn("discord")}
            className="flex items-center gap-1.5 rounded-lg border border-zest px-4 py-2 text-[12.5px] tracking-[0.1em] uppercase text-zest2 transition-colors hover:bg-zest/15 active:bg-zest/25"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Connexion</span>
          </button>
        )}
      </div>
    </header>
  );
}
