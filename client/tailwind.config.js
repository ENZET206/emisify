/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF1E8',
        soft: '#FFF8F0',
        peach: '#F8DCC5',
        terracotta: '#C94A2F',
        burnt: '#D9653F',
        brown: '#70452F',
        ink: '#2E211B',
        sage: '#71865A',
        forest: '#3F684B',
        mint: '#DDE7D5',
        olive: '#87905B',
        line: '#EBDCCD',
        muted: '#7A675C',
        danger: '#B42318',
        warning: '#B7791F',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        blob: '2.25rem 2.25rem 2.25rem 0.75rem',
        leaf: '2.5rem 0.75rem 2.5rem 0.75rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(46,33,27,.04), 0 8px 24px -12px rgba(112,69,47,.18)',
        lift: '0 2px 4px rgba(46,33,27,.05), 0 18px 40px -18px rgba(112,69,47,.32)',
      },
      keyframes: {
        rise: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
        pop: { '0%': { opacity: 0, transform: 'scale(.94)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        sway: { '0%,100%': { transform: 'rotate(-3deg)' }, '50%': { transform: 'rotate(3deg)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        blink: { '0%,80%,100%': { opacity: 0.25 }, '40%': { opacity: 1 } },
      },
      animation: {
        rise: 'rise .45s cubic-bezier(.2,.7,.2,1) both',
        pop: 'pop .25s cubic-bezier(.2,.7,.2,1) both',
        sway: 'sway 6s ease-in-out infinite',
        shimmer: 'shimmer 1.4s infinite',
        blink: 'blink 1.2s infinite',
      },
    },
  },
  plugins: [],
};
