/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#3B3B3B',
        paper: '#242424',
        orange: '#FF7049',
        'orange-soft': '#482A22',
        charcoal: '#F3EEE9',
        brown: '#B5AAA2',
        'brown-line': '#8E837B',
        'brown-light': '#8E837B',
        line: '#3B3937',
        rust: '#F08A63',
        rose: '#D9887E',
        gold: '#E6B85D',
        sage: '#9BAE9F',
        olive: '#A8AA7C',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Manrope', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(41,39,37,0.06)',
        md: '0 4px 12px rgba(41,39,37,0.08)',
      },
    },
  },
  plugins: [],
};
