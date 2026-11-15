/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        muted: "#74809a",
        brand: "#3568e8",
        canvas: "#f5f7fb",
      },
      boxShadow: {
        card: "0 8px 26px rgba(28, 43, 74, .06)",
      },
    },
  },
  plugins: [],
};
