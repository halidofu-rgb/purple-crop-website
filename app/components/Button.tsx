import Link from "next/link";
import { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-zest text-ink hover:opacity-90",
  secondary: "border border-line text-white hover:border-zest hover:text-zest",
  ghost: "text-ash hover:text-white",
  danger: "border border-blush text-blush hover:bg-blush hover:text-ink",
};

interface ButtonProps {
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

// Système de boutons unique pour tout le site — 4 variantes, mêmes
// proportions partout (radius, padding, typo).
export default function Button({
  href,
  onClick,
  variant = "primary",
  children,
  className = "",
}: ButtonProps) {
  const classes = `inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.1em] transition ${VARIANT_CLASSES[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
