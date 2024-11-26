/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
      rafik:{
        DEFAULT:"",
        secondary:"",
        teritiary:"",
        alternate:"",
        text:"",
        sectext:"",
        bg:"",
        secbg:"",
        streaks:"",
        error:"",
        success:"",
      },
      },
    },
  },
  plugins: [],
}