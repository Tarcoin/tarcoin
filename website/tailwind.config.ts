import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tarcoin: {
          gold: '#D4A843',
          'gold-light': '#F0D080',
          'gold-dark': '#B8860B',
          black: '#0A0A0A',
          'black-2': '#121212',
          'black-3': '#1A1A2E',
          gray: '#2A2A3E',
          'gray-light': '#3A3A4E',
          cyan: '#00D4FF',
          'cyan-dark': '#0099CC',
          neon: '#00FF88',
          red: '#FF4444',
          purple: '#7B2FF7',
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        space: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-slow': 'glow 4s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
        'matrix': 'matrix 20s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(212, 168, 67, 0.3), 0 0 10px rgba(212, 168, 67, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(212, 168, 67, 0.6), 0 0 40px rgba(212, 168, 67, 0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGold: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        scanline: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100px' },
        },
        matrix: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      backgroundImage: {
        'cyber-grid': 'linear-gradient(rgba(212, 168, 67, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212, 168, 67, 0.03) 1px, transparent 1px)',
        'cyber-gradient': 'linear-gradient(135deg, #0A0A0A 0%, #1A1A2E 50%, #0A0A0A 100%)',
        'gold-gradient': 'linear-gradient(135deg, #D4A843 0%, #F0D080 50%, #B8860B 100%)',
      },
    },
  },
  plugins: [],
};
export default config;