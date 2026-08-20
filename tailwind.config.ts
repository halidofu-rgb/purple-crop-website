import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // === CHARTE GRAPHIQUE — Purple Corp =====================================
        // Direction artistique validée (Claude Design) : mêmes noms de tokens
        // qu'avant (rien ne casse ailleurs sur le site), teintes mises à jour
        // vers la nuance de marque exacte.
        ink: "#161826",       // fond principal
        void2: "#1B1D33",     // fond secondaire
        panel: "#232532",     // surfaces
        panel2: "#262a60",    // cartes "présence" (hero, bannières) — signature
        line: "#2D2340",      // bordures (utiliser aussi border-paper/10 sur le nouveau travail)
        zest: "#9184d9",      // violet principal — LA couleur de marque
        iris: "#5d5294",      // violet secondaire — dégradés, profondeur
        zest2: "#b5abfc",     // violet clair — accents, lueurs de texte
        signal: "#45E0D0",    // accent lumineux — succès / progression
        warn: "#F5B963",      // alerte (avertissement)
        blush: "#FF6E8F",     // alerte (erreur / perte)
        ash: "#9397ab",       // texte secondaire
        paper: "#e9e9ed",     // texte principal clair — pour bordures en opacité (border-paper/10)
        steel: {
          300: "#cfd3e5", 400: "#b2b6ca", 500: "#9397ab",
          600: "#75798c", 700: "#595d6c", 800: "#3f424d",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        chip: "0 0 0 1px rgba(145,132,217,0.35), 0 8px 28px -10px rgba(145,132,217,0.35)",
        card: "0 10px 30px -12px rgba(22,24,38,0.6)",
        cardHover: "0 16px 40px -14px rgba(145,132,217,0.35)",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        sweep: {
          "0%": { transform: "translateX(-30%)", opacity: "0" },
          "40%": { opacity: "0.55" },
          "100%": { transform: "translateX(130%)", opacity: "0" },
        },
      },
      animation: {
        fadeInUp: "fadeInUp 0.4s ease-out both",
        sweep: "sweep 5.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
