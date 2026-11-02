/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#1e3a8a',
          800: '#1e3268',
          900: '#172554',
        },
        accent: {
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        status: {
          completed: '#10b981',
          inprogress: '#3b82f6',
          pending: '#6b7280',
          blocked: '#f59e0b',
          shortage: '#ef4444',
          overdue: '#dc2626',
          critical: '#b91c1c',
          cancelled: '#9ca3af',
        },
      },
      fontFamily: {
        sans: ['Urbanist', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,.10)',
        sidebar: '2px 0 8px rgba(0,0,0,.15)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { transform: 'translateX(-8px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
      },
    },
  },
  plugins: [],
}
