import Link from "next/link";
import { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-zest to-[#7C5CD1] text-ink shadow-[0_8px_24px_-8px_rgba(159,122,234,0.6)] hover:shadow-[0_10px_30px_-8px_rgba(159,122,234,0.75)] hover:brightness-105",
  secondary: "border border-line bg-panel2/60 text-white hover:border-zest hover:text-zest",
  ghost: "text-ash hover:text-white hover:bg-panel2/60",
  danger: "border border-blush text-blush hover:bg-blush hover:text-ink",
};

const SIZE_CLASSES: Record<Size, string> = {
  md: "px-5 py-2.5 text-xs",
  lg: "px-7 py-3.5 text-sm",
};

interface ButtonProps {
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

// Système de boutons unique pour tout le site. Le primaire a un vrai
// dégradé + halo, et tous les boutons "s'enfoncent" légèrement au clic
// (active:scale) pour un vrai retour tactile.
export default function Button({
  href,
  onClick,
  variant = "primary",
  size = "md",
  icon,
  children,
  className = "",
}: ButtonProps) {
  const classes = `inline-flex items-center gap-2 rounded-full font-display font-semibold uppercase tracking-[0.1em] transition-all duration-150 active:scale-95 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={classes}>
      {icon}
      {children}
    </button>
  );
}
