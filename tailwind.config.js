/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        medix: {
          bg: "#071815", bgAlt: "#0E2620", surface: "#0D1F1B", surfaceAlt: "#123028",
          border: "#1E4A3E", accent: "#4FC3F7", accentDeep: "#2E9BD6",
          gold: "#E8B85C", goldDeep: "#C9A227", text: "#F4EAD2",
          textMuted: "#B9C4E0", textDim: "#8393B5", danger: "#E8664F", success: "#4FA876",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
