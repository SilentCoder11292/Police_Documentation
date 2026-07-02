/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          950: '#071126', // Bihar Police Deepest Slate
          900: '#0F1E36', // Primary Deep Navy
          800: '#1B2E4B', // Secondary Slate
          700: '#2C4468', // Steel Gray
          600: '#3F5B85', // Mid Blue
          500: '#5675A1', // Light Steel
          400: '#7E9BBF', // Soft Ice Blue
          100: '#E6EFFB', // Soft bg blue
          50: '#F2F7FD',  // Very soft border blue
        },
        gold: {
          700: '#8A620D', // Brass Border
          600: '#B0821A', // Saffron Gold
          500: '#D4A32D', // Bihar Crest Gold
          400: '#E9C262', // Highlight Gold
          100: '#FEF9E6', // Warm Gold Tint
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
