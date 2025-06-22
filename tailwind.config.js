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
        topsets: {
          DEFAULT: '#3995c5',
          secondary: '#1578ac',
          teritiary: '#3995c5',
          alternate: '#1ea191',
          darkeralt: '#154b5d',
          pritext: '#132e3d',
          sectext: '#0f425d',
          pribg: '#ececec',
          secbg: '#bac3c8',
          streak: '#FF5733',
          error: '#FF0000',
          success: '#00FF00',
            darkpritext: '#ececec',
            darksectext: '#bac3c8',
            darkpribg: '#132e3d',
            darksecbg: '#0f425d',
        },
      },
    },
  },
  plugins: [flowbite],
};
