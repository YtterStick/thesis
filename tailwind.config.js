/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // Enables dark mode using the .dark class
  theme: {
    extend: {
      fontFamily: {
        century: [
          '"Century Gothic"',
          "CenturyGothic",
          "AppleGothic",
          "sans-serif",
        ],
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};