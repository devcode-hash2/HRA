/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'bg-login': "url('assets/images/bg-login.jpg')",
      },
      // backgroundPosition: {
      //   'right': 'right',
      // },
      // backgroundRepeat: {
      //   'no-repeat': 'no-repeat',
      // },
      // backgroundSize: {
      //   '5': '5%',
      // },
      boxShadow:{
        'custom-menu':"inset 6px 0 0 0 #793576, inset 6px 0 6px 1px #ffffff",
        'custom-menu-hover': "inset 6px 0 0 0 #bc9abb, inset 6px 0 6px 1px #ffffff"
      },
      colors: {
        primary: {
          "50" : "#efe7ef",
          "100" : "#d7c2d6",
          "200" : "#bc9abb",
          "300" : "#a1729f",
          "400" : "#8d538b",
          "500" : "#793576",
          "600" : "#71306e",
          "700" : "#662863",
          "800" : "#5c2259",
          "900" : "#491646",
          "A100" : "#ff86f7",
          "A200" : "#ff53f4",
          "A400" : "#ff20f0",
          "A700" : "#ff07ef"
        },
        secondary:{
          "50" : "#f1fafe",
          "100" : "#e3f2fb",
          "200" : "#c1e7f6",
          "300" : "#85d3ef",
          "400" : "#4bbfe5",
          "500" : "#23a7d4",
          "600" : "#1587b4",
          "700" : "#126d92",
          "800" : "#135b79",
          "900" : "#164c64",
          "950" : "#0e3143"          
        }
      }
    },
    fontFamily: {
      'body': [
      'Open Sans', 
      'ui-sans-serif', 
      'system-ui', 
      '-apple-system', 
      'system-ui', 
      'Segoe UI', 
      'Roboto', 
      'Helvetica Neue', 
      'Arial', 
      'Noto Sans', 
      'sans-serif', 
      'Apple Color Emoji', 
      'Segoe UI Emoji', 
      'Segoe UI Symbol', 
      'Noto Color Emoji'
    ],
        'sans': [
      'Open Sans', 
      'ui-sans-serif', 
      'system-ui', 
      '-apple-system', 
      'system-ui', 
      'Segoe UI', 
      'Roboto', 
      'Helvetica Neue', 
      'Arial', 
      'Noto Sans', 
      'sans-serif', 
      'Apple Color Emoji', 
      'Segoe UI Emoji', 
      'Segoe UI Symbol', 
      'Noto Color Emoji'
    ]
  }
  },
  plugins: [],
  
}



