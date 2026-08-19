import { ReactNode } from "react";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-line text-ash",
  primary: "border-zest/40 text-zest",
  success: "border-signal/40 text-signal",
  warning: "border-warn/40 text-warn",
  danger: "border-blush/40 text-blush",
};

// Badge unique pour tout le site : club, saison, rôle, progression,
// Ranked... — seule la couleur (tone) change selon le sens de l'info.
export default function Badge({
  children,
  tone = "neutral",
  icon,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border bg-panel2/60 px-2.5 py-1 font-mono text-[11px] font-medium ${TONE_CLASSES[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}
