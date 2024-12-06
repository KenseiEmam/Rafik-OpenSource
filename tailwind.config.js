/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
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
          pritext: '#E8F3ED',
          sectext: '#9FB9B2',
          pribg: '#081411',
          secbg: '#000503',
          streak: '',
          error: '',
          success: '',
        },
      },
    },
  },
  plugins: [],
}
