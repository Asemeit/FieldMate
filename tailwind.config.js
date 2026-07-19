/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F4F9F4',
          100: '#E8F3E8',
          200: '#C7E4C7',
          300: '#9AD09A',
          400: '#74C69D', // Accent Mint
          500: '#40916C', // Leaf Green
          600: '#2D6A4F', // Solid Green
          700: '#1B4332', // Deep Forest Green (Primary Agricultural Brand Color)
          800: '#081C15', // Deep Organic Dark
          900: '#030C07',
          950: '#020805',
        },
        accent: {
          light: '#EAF5EA',
          vibrant: '#52B788',
          dark: '#081C15',
        },
        sand: {
          50: '#FAF8F5',
          100: '#F3ECE3',
          200: '#E7DCBE',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 8px 30px rgb(27, 67, 50, 0.08)',
        'premium-hover': '0 12px 40px rgb(27, 67, 50, 0.14)',
        'glass': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      }
    },
  },
  plugins: [],
}
