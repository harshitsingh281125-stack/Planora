/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'teal': '#1A8C8C',
        'light-blue': '#80C8FF',
        'navy': '#0B2239',
        'gray-bg': '#F8F9FB',
      },
    },
  },
  plugins: [],
}

