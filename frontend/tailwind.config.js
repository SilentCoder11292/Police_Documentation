/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        police: {
          50: '#f5f3ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8', // Indigo-400 (luminous accent for dark mode)
          500: '#6366f1',
          600: '#4f46e5', // Indigo-600 (corporate anchor for light mode)
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        gov: {
          950: '#0b0f19', // Dark mode body obsidian
          900: '#151c2c', // Dark mode card background
          800: '#1e293b', 
          700: '#334155',
          600: '#475569',
          550: '#64748b',
          400: '#94a3b8',
          100: '#f1f5f9', 
          50: '#f8fafc',
        },
        gold: {
          100: '#e0e7ff',
          400: '#a5b4fc',
          500: '#818cf8', // Luminous indigo-400 fallback
          600: '#6366f1', // Indigo-500
          700: '#4f46e5', // Indigo-600
        }
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Geist"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Cinzel"', 'serif'],
      }
    },
  },
  plugins: [],
}
