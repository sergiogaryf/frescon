import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          primary: "#3AAA35",
          dark: "#2A7A26",
          leaf: "#1A5C18",
        },
        yellow: {
          brand: "#F9C514",
          dark: "#E0B010",
        },
        black: {
          soft: "#1A1A1A",
        },
        gray: {
          text: "#666666",
        },
      },
      fontFamily: {
        nunito: ["var(--font-nunito)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        pacifico: ["var(--font-pacifico)", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
