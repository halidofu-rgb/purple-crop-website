import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // === CHARTE GRAPHIQUE — Purple Corp ===================================
        // Mapping exact des rôles demandés. Certains rôles partagent une même
        // couleur quand ça a du sens (succès ≈ progression = "signal") —
        // c'est documenté ici plutôt que dupliqué en tokens redondants.
        ink: "#0D0916",      // fond principal
        void2: "#120D1C",    // fond secondaire (sections alternées)
        panel: "#16101F",    // surfaces
        panel2: "#1E1730",   // cartes / éléments élevés
        line: "#2D2340",     // bordures
        zest: "#9F7AEA",     // violet principal — identité, trophées
        iris: "#7C5CD1",     // violet secondaire — dégradés, accents profonds
        zest2: "#C4B5FD",    // violet clair — valeurs secondaires, contraste doux
        signal: "#45E0D0",   // accent lumineux — succès / progression / en direct
        warn: "#F5B963",     // alerte (avertissement)
        blush: "#FF6E8F",    // alerte (erreur / perte)
        ash: "#948AA8",      // texte secondaire
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
