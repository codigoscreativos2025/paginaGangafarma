import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0E3A73",
        secondary: "#ABD904",
        accent: "#98BF0A",
        highlight: "#F28322",
        light: "#F2F2F2",
        "background-light": "#f5f8f8",
        "background-dark": "#0f231f",
      },
    },
  },
  plugins: [],
};

export default config;
