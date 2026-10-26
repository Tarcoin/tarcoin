/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tarcoin: {
          gold: '#D4A843',
          goldlight: '#F0C060',
          black: '#080B0F',
          black2: '#111118',
          border: '#1E232B',
          text: '#E8E8F0',
          muted: '#888899',
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        heading: ['Orbitron', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
