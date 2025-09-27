/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",    // app router
    "./pages/**/*.{js,ts,jsx,tsx}",  // pages router
    "./components/**/*.{js,ts,jsx,tsx}", // ShadCN components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
