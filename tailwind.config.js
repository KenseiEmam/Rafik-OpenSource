import flowbite from 'flowbite/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js"
  ],
  darkMode: 'class', // Enables dark mode using a class
  theme: {
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      padding: {
        full: '100%',
      },
      spacing: {
        128: '32rem',
        144: '36rem',
        A4W: '794px',
        A4H: '1123px',
        '2page': '2244px',
        '75vh': '75vh',
      },
      minHeight: {
        '1/2': '50%',
        64: '16rem',
        '80vh': '80vh',
      },
      colors: {
        rafik: {
          DEFAULT: '#D7BD21',
          secondary: '#CB901C',
          teritiary: '#B02DEF',
          alternate: '#2EBE71',
          darkeralt: '#295F42',
          pritext: '#190a03',
          sectext: '#8C644C',
          pribg: '#f3eeeb',
          secbg: '#E2D8D1',
          streak: '#FF5733',
          error: '#FF0000',
          success: '#00FF00',
            darkpritext: '#E8F3ED',
            darksectext: '#9FB9B2',
            darkpribg: '#081411',
            darksecbg: '#000503',
        },
      },
    },
  },
  plugins: [flowbite],
};
