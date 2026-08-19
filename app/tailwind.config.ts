import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // === DESIGN TOKENS — Purple Corp =====================================
        // Palette "télémétrie" ancrée dans l'emblème du club. Un seul ton
        // violet pour le fond/surfaces, des accents dédiés à un rôle précis
        // (jamais utilisés en dehors de ce rôle) — voir globals.css pour le
        // même jeu de tokens en variables CSS brutes.
        ink: "#0D0916",     // fond principal
        panel: "#16101F",   // surface / carte
        panel2: "#1E1730",  // surface élevée (hover, lignes actives)
        line: "#2D2340",    // bordures
        zest: "#9F7AEA",    // couleur principale — identité, trophées
        zest2: "#C4B5FD",   // couleur principale claire — valeurs secondaires
        signal: "#45E0D0",  // succès / progression / en direct
        warn: "#F5B963",    // avertissement
        blush: "#FF6E8F",   // erreur / perte / défaite
        ash: "#948AA8",     // texte secondaire
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        chip: "0 0 0 1px rgba(159,122,234,0.35), 0 8px 28px -10px rgba(159,122,234,0.35)",
        card: "0 10px 30px -12px rgba(13,9,22,0.6)",
        cardHover: "0 16px 40px -14px rgba(159,122,234,0.35)",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeInUp: "fadeInUp 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
