const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  secondary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
  },
  // Neutral colors for text, backgrounds, etc.
  neutral: {
    50: '#fafafa',
    100: '#f0f0f0',
    200: '#e0e0e0',
    300: '#c0c0c0',
    400: '#909090',
    500: '#505050',
    600: '#262626',
    700: '#1a1a1a',
    800: '#121212',
    900: '#0a0a0a',
    950: '#050505',
  },
  // You can add more color schemes as needed
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Your existing colors...
        ...colors,
      },
    },
  },
  plugins: [],
}
