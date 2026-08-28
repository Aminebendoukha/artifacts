/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./App.jsx", "./Layout.jsx", "./AdminDashboard.jsx", "./ClientDashboard.jsx", "./NewOrder.jsx", "./OrderDetails.jsx", "./main.jsx", "./ui.jsx", "./orbitApi.jsx", "./orderConstants.jsx", "./roleContext.jsx"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
      borderRadius: {
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
};
