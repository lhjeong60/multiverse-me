/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0c',
        surface: '#141418',
        surface2: '#1c1c22',
        border: '#2a2a33',
        dim: '#8a8890',
        accent: '#ff6b35',
        accent2: '#c4a1ff',
        accent3: '#35d0ba',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'serif'],
        sans: ['"DM Sans"', '"Noto Sans KR"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
