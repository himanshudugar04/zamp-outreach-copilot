import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Zamp brand: near-black, white, coral accent, soft blue tint
        paper: "#F4F6FA",
        sheet: "#FFFFFF",
        ink: { DEFAULT: "#171717", 2: "#525866", 3: "#8B919E" },
        rule: "#E4E7EE",
        brand: { DEFAULT: "#EF4A4A", soft: "#FDECEC" },
        sky: { DEFAULT: "#3557D6", soft: "#EDF2FF", deep: "#233E9E" },
        ledger: { DEFAULT: "#15803D", soft: "#E7F6EC", deep: "#0F5F2D" },
        marker: "#DCE6FF",
        rust: { DEFAULT: "#B45309", soft: "#FEF3E2" },
        brick: { DEFAULT: "#C53030", soft: "#FDECEC" },
        violet: { DEFAULT: "#6D4BD8", soft: "#F1ECFF" },
        teal: { DEFAULT: "#0E7C7B", soft: "#E3F5F4" },
      },
      fontSize: { "2xs": ["11px", "16px"] },
    },
  },
  plugins: [],
};
export default config;
