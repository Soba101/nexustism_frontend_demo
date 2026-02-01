import type { Config } from "tailwindcss";

// Tailwind CSS v4 config - minimal config needed
// Most configuration moved to CSS @theme directive in globals.css
const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
