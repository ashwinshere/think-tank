import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F8F7F3",
        surface: "#FFFFFF",
        ink: "#26241F",
        subink: "#615D53",
        line: "#E7E3D9",
        accent: {
          DEFAULT: "#3E6E63",
          light: "#EAF1EE",
          dark: "#2C5049",
        },
        peer: {
          explorer: "#3E7A8F",
          explorerBg: "#EAF3F6",
          challenger: "#B8703D",
          challengerBg: "#F8EFE5",
          critic: "#7A5C7E",
          criticBg: "#F2ECF3",
          mentor: "#5C8A5B",
          mentorBg: "#EDF4EC",
          devil: "#A8534B",
          devilBg: "#F7EAE8",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(38, 36, 31, 0.06)",
        card: "0 1px 2px rgba(38,36,31,0.04), 0 8px 24px rgba(38,36,31,0.05)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 80%, 100%": { opacity: "0.25" },
          "40%": { opacity: "1" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.35s ease-out",
        pulseDot: "pulseDot 1.2s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};
export default config;
