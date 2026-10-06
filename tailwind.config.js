/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0d1117',
        surface:  '#1a2235',
        surface2: '#222d42',
        surface3: '#2a3550',
        border:   '#2e3f5c',
        accent:   '#3b82f6',
        accent2:  '#1d4ed8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
