import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        earth: {
          50: '#fdfaf7',
          100: '#f7eee5',
          200: '#eddac7',
          300: '#dfbda3',
          400: '#cf9c7b',
          500: '#c17e5a',
          600: '#a86142',
          700: '#8c4b37',
          800: '#723e31',
          900: '#5e342b',
          950: '#341915',
        },
        soil: {
          50: '#fbf8f3',
          100: '#f3eada',
          200: '#e5d2b2',
          300: '#d4b483',
          400: '#c39556',
          500: '#a9763a',
          600: '#8c5a2e',
          700: '#6e4326',
          800: '#5c3723',
          900: '#4e2d20',
          950: '#2a150e',
        },
        slateDark: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
