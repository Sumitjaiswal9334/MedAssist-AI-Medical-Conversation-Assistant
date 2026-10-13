/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        clinic: {
          ink: "#13211f",
          muted: "#5f706d",
          line: "#d9e4e1",
          surface: "#f7fbfa",
          teal: "#087f7a",
          tealDark: "#05615d",
          mint: "#dff5ee",
          blue: "#2f6fed",
          coral: "#e76f51"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(19, 33, 31, 0.10)",
        field: "0 10px 30px rgba(8, 127, 122, 0.12)"
      }
    }
  },
  plugins: []
};
