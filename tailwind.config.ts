import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f0f7f4",
          100: "#dcf0e6",
          200: "#bae1ce",
          300: "#8eccaf",
          400: "#5eb08b",
          500: "#3d946f",
          600: "#2d7658",
          700: "#245e47",
          800: "#1e4c3a",
          900: "#183e30",
          950: "#091712",
        },
        sage: {
          50: "#f4f6f4",
          100: "#e6ebe5",
          200: "#ccd7cc",
          300: "#a9bfa8",
          400: "#809f7f",
          500: "#60805f",
          600: "#4b654a",
          700: "#3b503a",
          800: "#314130",
          900: "#293729",
          950: "#141c14",
        },
        pine: {
          900: "#0b1913",
          950: "#060e0a",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["var(--font-fira-code)", "monospace"],
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(61, 148, 111, 0.3)",
        glass: "0 8px 32px 0 rgba(0, 20, 10, 0.37)",
      },
    },
  },
  plugins: [],
};

export default config;
