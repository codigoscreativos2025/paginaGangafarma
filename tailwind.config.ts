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
      fontSize: {
        'base': ['1.125rem', '1.75rem'],
        'lg': ['1.25rem', '1.75rem'],
        'xl': ['1.5rem', '2rem'],
        '2xl': ['1.875rem', '2.25rem'],
        '3xl': ['2.25rem', '2.5rem'],
        '4xl': ['3rem', '1'],
        'price': ['1.5rem', '1.75rem'],
        'price-lg': ['2rem', '2.25rem'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      minHeight: {
        'button': '3.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
