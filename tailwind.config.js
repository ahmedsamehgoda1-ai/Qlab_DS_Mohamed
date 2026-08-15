/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#060C16",
          900: "#0A1626",
          800: "#102A4C",
          700: "#163B66",
        },
        bmw: {
          blue: "#1C69D4",
          sky: "#4FA8E8",
          teal: "#16B8A6",
          indigo: "#5B6EF5",
        },
        ink: "#0B0F14",
        slate: {
          DEFAULT: "#5B6B7C",
          light: "#9FB0C3",
        },
        paper: "#F4F7FB",
        hairline: "#E4E9EF",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
