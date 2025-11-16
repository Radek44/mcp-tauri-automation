/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef5ee',
          100: '#fde9d7',
          200: '#facfae',
          300: '#f7ae7a',
          400: '#f38244',
          500: '#f06420',
          600: '#e14916',
          700: '#bb3614',
          800: '#952d18',
          900: '#792816',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
