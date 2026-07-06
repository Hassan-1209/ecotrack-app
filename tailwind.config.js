/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Deep forest green — primary brand color
        forest: {
          50: '#f0f9f0',
          100: '#dcf2dc',
          200: '#bbe4bc',
          300: '#8ed093',
          400: '#5cb465',
          500: '#3a9843',
          600: '#2a7a33',
          700: '#246129',
          800: '#204e23',
          900: '#1c421f',
          950: '#0d2812',
        },
        // Sage/teal — secondary, for health/wellbeing
        sage: {
          50: '#f1f8f6',
          100: '#ddeee9',
          200: '#bce0d8',
          300: '#8fcac0',
          400: '#5daba0',
          500: '#428e85',
          600: '#35736c',
          700: '#2e5d58',
          800: '#294b48',
          900: '#243f3d',
        },
        // Amber/gold — accent for key numbers, streaks, highlights
        earth: {
          50: '#fdf8ed',
          100: '#f9edcc',
          200: '#f2d98f',
          300: '#eac15a',
          400: '#e3a82f',
          500: '#d18d1a',
          600: '#b06d14',
          700: '#8c5214',
          800: '#724218',
          900: '#5f3717',
        },
        // Teal — contrasting accent for transport/active
        teal2: {
          50: '#effbfa',
          100: '#d6f5f2',
          200: '#b0ebe7',
          300: '#7adcd6',
          400: '#44c5be',
          500: '#2aa8a1',
          600: '#238782',
          700: '#206b68',
          800: '#1f5654',
          900: '#1d4846',
        },
        // Sky blue — for wellbeing/health tie-in
        sky2: {
          50: '#eff9ff',
          100: '#daefff',
          200: '#bce3ff',
          300: '#8ed0ff',
          400: '#59b4ff',
          500: '#3394ff',
          600: '#1c75f5',
          700: '#155ce0',
          800: '#1749b5',
          900: '#193f8f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 8px 24px -4px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)',
        'elevated': '0 12px 32px -8px rgb(0 0 0 / 0.12), 0 4px 12px -4px rgb(0 0 0 / 0.06)',
        'glow-forest': '0 0 0 1px rgb(58 152 67 / 0.1), 0 4px 16px -2px rgb(58 152 67 / 0.15)',
        'glow-amber': '0 0 0 1px rgb(209 141 26 / 0.1), 0 4px 16px -2px rgb(209 141 26 / 0.15)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out both',
        'fade-in': 'fadeIn 0.3s ease-out both',
        'count-up': 'countUp 0.5s ease-out',
        'press': 'press 0.15s ease',
        'bar-grow': 'barGrow 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'celebrate': 'celebrate 0.6s ease-out',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        countUp: {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        press: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        barGrow: {
          from: { transform: 'scaleY(0)' },
          to: { transform: 'scaleY(1)' },
        },
        celebrate: {
          '0%': { transform: 'scale(0) rotate(-10deg)', opacity: '0' },
          '50%': { transform: 'scale(1.15) rotate(5deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
