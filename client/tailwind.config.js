/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F5F0E6',
        paper: '#FFFCF6',
        orange: '#F47745',
        'orange-soft': '#FBE4D8',
        charcoal: '#292725',
        brown: '#786B60',
        'brown-line': '#DDD5C9',
        line: '#DDD5C9',
        rust: '#B85C38',
        rose: '#C97B7B',
        gold: '#C9A227',
        sage: '#7A8B6F',
        olive: '#6B7A5E',
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
