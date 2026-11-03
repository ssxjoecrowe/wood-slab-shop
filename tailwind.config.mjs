/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        wood: {
          50: '#fdf8f3',
          100: '#faf0e6',
          200: '#f3e1d1',
          300: '#e6c9b0',
          400: '#d4a884',
          500: '#c18a61',
          600: '#b07350',
          700: '#925c41',
          800: '#784b38',
          900: '#624031',
          950: '#331f17',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['2.25rem', { lineHeight: '1.3' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'wood': '0 10px 40px -10px rgba(146, 92, 65, 0.15), 0 4px 20px -4px rgba(146, 92, 65, 0.1)',
        'wood-lg': '0 20px 60px -15px rgba(146, 92, 65, 0.2), 0 8px 30px -8px rgba(146, 92, 65, 0.15)',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
};