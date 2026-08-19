import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palette "télémétrie" ancrée dans l'emblème Purple Corp : un seul
        // ton violet pour le fond/surfaces, deux accents vifs pour les
        // données (violet = identité, cyan = signal positif/en direct).
        ink: "#0D0916",
        panel: "#16101F",
        panel2: "#1E1730",
        line: "#2D2340",
        zest: "#9F7AEA",   // violet — accent principal, trophées
        zest2: "#C4B5FD",  // violet clair
        signal: "#45E0D0", // cyan — données positives / en direct
        blush: "#FF6E8F",  // rose — pertes / alertes
        ash: "#948AA8",    // texte secondaire
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        chip: "0 0 0 1px rgba(159,122,234,0.35), 0 8px 28px -10px rgba(159,122,234,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
