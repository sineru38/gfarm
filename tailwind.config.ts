import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif KR"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        forest: {
          50:  '#f0f7f1',
          100: '#e8f5e9',
          200: '#c8e6c9',
          300: '#a5d6a7',
          400: '#66bb6a',
          500: '#4a7c59',
          600: '#3d6b4f',
          700: '#2d5a3d',
          800: '#1e3320',
          900: '#1a2e1c',
        },
        sand: {
          50:  '#faf8f3',
          100: '#fdf3e7',
          200: '#f5dfc0',
          300: '#e8c99a',
        },
        wood: {
          500: '#6d4c2a',
          600: '#a1590f',
        },
      },
    },
  },
  plugins: [],
}
export default config
