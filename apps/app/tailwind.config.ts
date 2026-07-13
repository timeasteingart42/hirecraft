import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        paper: "#FAFAF7",
        panel: "#FFFFFF",
        brand: { DEFAULT: "#1A1A1A", light: "#2A2A2A", dark: "#000000" },
        accent: "#8B6F3C",
        neutral: {
          50: "#F6F5F1",
          100: "#EEECE5",
          150: "#E5E2D9",
          200: "#DAD6CB",
          300: "#B7B2A3",
          400: "#8F8B7E",
          500: "#63615A",
          600: "#48463F",
          700: "#2E2D28",
          800: "#1C1B18",
          900: "#111111",
        },
        status: {
          strong: "#2F5233",
          fit: "#1F3D5C",
          reach: "#8B6F3C",
          skip: "#7A2E1F",
        },
      },
      fontFamily: {
        serif: [
          '"Charter"',
          '"Iowan Old Style"',
          '"Palatino Linotype"',
          "Palatino",
          "Georgia",
          "serif",
        ],
        sans: [
          '"Inter"',
          '"SF Pro Text"',
          "-apple-system",
          "BlinkMacSystemFont",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: ['"JetBrains Mono"', "ui-monospace", '"SF Mono"', "Menlo", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.1rem", letterSpacing: "0.02em" }],
        sm: ["0.875rem", { lineHeight: "1.4rem" }],
        base: ["1rem", { lineHeight: "1.6rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.35rem", { lineHeight: "1.85rem" }],
        "2xl": ["1.625rem", { lineHeight: "2rem", letterSpacing: "-0.01em" }],
        "3xl": ["2rem", { lineHeight: "2.4rem", letterSpacing: "-0.015em" }],
        "4xl": ["2.5rem", { lineHeight: "2.85rem", letterSpacing: "-0.02em" }],
        "5xl": ["3.25rem", { lineHeight: "3.6rem", letterSpacing: "-0.025em" }],
      },
      letterSpacing: {
        widest: "0.18em",
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "5px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      boxShadow: {
        card: "0 1px 0 rgba(17,17,17,0.04), 0 1px 3px rgba(17,17,17,0.04)",
        cardHover: "0 2px 0 rgba(17,17,17,0.06), 0 4px 12px rgba(17,17,17,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
