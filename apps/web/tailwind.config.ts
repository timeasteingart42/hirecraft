import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F1419",
        paper: "#F7F5F0",
        brand: {
          DEFAULT: "#1F3D5C",
          light: "#2E5580",
          dark: "#152C42",
        },
        accent: "#B8843D",
        neutral: {
          50: "#FAFAF7",
          100: "#F0EEE8",
          200: "#D7D2C4",
          300: "#B8B2A3",
          500: "#6B6863",
          700: "#3A3D45",
          900: "#12161F",
        },
      },
      fontFamily: {
        serif: ["Georgia", '"Iowan Old Style"', '"Palatino Linotype"', "serif"],
        sans: ["-apple-system", "BlinkMacSystemFont", '"SF Pro Text"', '"Helvetica Neue"', "Arial", "sans-serif"],
        mono: ["ui-monospace", '"SF Mono"', "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
