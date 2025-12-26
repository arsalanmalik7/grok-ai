/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        grok: {
          primary: '#1a1a1a',
          secondary: '#2d2d2d',
          accent: '#0066ff',
        }
      }
    },
  },
  plugins: [],
}

