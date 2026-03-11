/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        accent: '#ff6b35',
        text: '#e8e8ea',
        dim: '#c8c8cc',
        subtle: '#9898a0',
        muted: '#6b6b72',
        surface: '#161618',
        border: '#2a2a2e',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
