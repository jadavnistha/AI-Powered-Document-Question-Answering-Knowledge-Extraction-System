/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F8FBFF',
        'paper-alt': '#FFFFFF',
        ink: '#40557C',
        'ink-soft': '#7C8EAF',
        'ink-dark': '#172B4D',
        annotation: '#6366F1',
        'annotation-hover': '#8B5CF6',
        highlight: '#C4B5FD',
        rule: '#DCE5F3',
        danger: '#DC5A6A',
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '10px',
      },
      keyframes: {
        'underline-load': {
          '0%': { transform: 'translateX(-130%)' },
          '50%': { transform: 'translateX(170%)' },
          '100%': { transform: 'translateX(360%)' },
        },
        'float-soft': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      animation: {
        'underline-load': 'underline-load 1.5s ease-in-out infinite',
        'float-soft': 'float-soft 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
