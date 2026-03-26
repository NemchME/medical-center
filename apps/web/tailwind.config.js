/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f0ff',
          100: '#e9e3ff',
          200: '#d5cbff',
          300: '#b8a4ff',
          400: '#9670ff',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b0764',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          light: '#c4b5fd',
        },
      },
      backgroundImage: {
        'cosmic': 'linear-gradient(135deg, #1a0533 0%, #2d1b69 50%, #4c1d95 100%)',
      },
    },
  },
  plugins: [],
};
