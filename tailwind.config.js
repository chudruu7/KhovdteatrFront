/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // CSS variable-тай холбоно — theme солигдоход автоматаар өөрчлөгдөнө
        'th-bg':       'var(--bg-primary)',
        'th-bg2':      'var(--bg-secondary)',
        'th-card':     'var(--bg-card)',
        'th-text':     'var(--text-primary)',
        'th-text2':    'var(--text-secondary)',
        'th-muted':    'var(--text-muted)',
        'th-border':   'var(--border-color)',
      },
      animation: {
        'gradient-x': 'gradient-x 3s ease infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-size':'200% 200%', 'background-position':'left center' },
          '50%':       { 'background-size':'200% 200%', 'background-position':'right center' },
        }
      },
    },
  },
  plugins: [],
}