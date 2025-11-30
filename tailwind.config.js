/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        earth: {
          50: '#f5f5f0',
          100: '#e8e8d8',
          200: '#d4d4b8',
          300: '#b8b890',
          400: '#9a9a6e',
          500: '#7d7d52',
          600: '#6b6b45',
          700: '#5a5a3a',
          800: '#4a4a2f',
          900: '#3d3d26',
        },
        green: {
          50: '#f0f7f4',
          100: '#d9ede5',
          200: '#b3dbc9',
          300: '#86c3a8',
          400: '#5aa686',
          500: '#3d8b6b',
          600: '#2d6f56',
          700: '#245947',
          800: '#1f483a',
          900: '#1a3c30',
        },
        beige: {
          50: '#faf9f6',
          100: '#f5f3ed',
          200: '#e8e4d8',
          300: '#d9d2c0',
          400: '#c7bda6',
          500: '#b5a88c',
          600: '#9d8f72',
          700: '#82755e',
          800: '#6b5f4e',
          900: '#574d41',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Microsoft JhengHei', '微軟正黑體', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}



