/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F97316', // Orange
          foreground: '#FFFFFF',
        },
        brand: {
          DEFAULT: '#F97316', // Orange
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#9A6C58',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#6B7280', // Gray
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#FF4B4B', // Vibrant Red
          foreground: '#FFFFFF',
        },
        background: '#FFFFFF', // Clean white background
        foreground: '#4B4B4B', // Dark gray text
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#4B4B4B',
        },
        success: '#58CC02', // Green (Keep for positive)
        warning: '#FFC800', // Yellow
        border: '#F3F4F6',
        muted: {
          DEFAULT: '#F3F4F6',
          foreground: '#AFAFAF',
        },
        // Utility colors for colorful UI
        sky: '#0EA5E9',
        indigo: '#6366F1',
        purple: '#A855F7',
        pink: '#EC4899',
        orange: '#F97316',
        teal: '#14B8A6',
        yellow: '#EAB308',
      }
    },
  },
  plugins: [],
}
