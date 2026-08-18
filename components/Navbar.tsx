import Image from "next/image";
import Link from "next/link";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/clubs", label: "Clubs" },
  { href: "/classement", label: "Classement" },
  { href: "/pusheurs", label: "Pusheurs" },
];

export default function Navbar() {
  return (
    <header className="border-b border-line bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Purple Corp" width={36} height={36} className="h-9 w-9" />
          <span className="font-display text-sm font-extrabold uppercase tracking-[0.15em] text-white">
            Purple Corp
          </span>
        </Link>
        <nav className="flex gap-4 sm:gap-6">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-display text-xs font-semibold uppercase tracking-[0.1em] text-ash transition hover:text-zest sm:text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
