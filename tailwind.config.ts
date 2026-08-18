import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#181022",       // fond principal, violet quasi-noir
        panel: "#241733",     // cartes / surfaces
        panel2: "#2E1D42",    // surfaces surélevées
        line: "#3A2753",      // bordures
        zest: "#F4D93E",      // jaune "trophée" - accent principal
        zest2: "#FFE97A",
        signal: "#5FE0C0",    // vert-eau, données positives / rang
        blush: "#FF6E8F",     // rose, alertes / défaite
        ash: "#B9AEC9",       // texte secondaire
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        chip: "0 0 0 1px rgba(244,217,62,0.35), 0 8px 24px -8px rgba(244,217,62,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
