import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          bg: "#0A0B0D",
          surface: "#121418",
          surface2: "#191C22",
          line: "#262A31",
          line2: "#343A43",
          text: "#ECEEF1",
          muted: "#9198A1",
          accent: "#F5B301",
          accentSoft: "rgba(245,179,1,0.12)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        brand: "0.18em",
      },
    },
  },
  plugins: [],
};

export default config;
