import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#E6FAF4',
          100: '#C2F0E0',
          200: '#85DFC0',
          300: '#42C99A',
          400: '#1DB87A',
          500: '#0F9E64',
          600: '#0A7D4F',
          700: '#065C3A',
          800: '#033D26',
          900: '#011F13',
        },
        ocean: {
          50:  '#EEF4FF',
          100: '#D1E3FF',
          200: '#A8C7FF',
          300: '#6FA3FF',
          400: '#3B7BFF',
          500: '#1A5CFF',
          600: '#1244CC',
          700: '#0D2F96',
          800: '#081E63',
          900: '#040F32',
        },
        sand: {
          50:  '#FDFAF5',
          100: '#F7F0E2',
          200: '#EEE0C4',
          300: '#E2CB9E',
          400: '#D4B06E',
          500: '#C49448',
          600: '#A87A30',
          700: '#845E1E',
          800: '#5E420F',
          900: '#3A2706',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'typing': 'typing 1.2s steps(3, end) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
        typing: { '0%, 100%': { opacity: '0.2' }, '50%': { opacity: '1' } },
      },
      backgroundImage: {
        'hero-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230F9E64' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

export default config
