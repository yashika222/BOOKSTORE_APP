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
        brand: {
          50: '#fafafa',
          100: '#f5e6e8',
          200: '#e8c5c9',
          500: '#a03037',
          600: '#92202F',
          700: '#7c1e1e',
        }
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Prevents Tailwind base reset from conflicting with Ant Design button and typography styles
  }
};
export default config;
