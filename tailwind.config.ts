import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      boxShadow: {
        soft: '0 10px 40px -18px rgba(15, 23, 42, 0.35)'
      }
    }
  },
  plugins: []
} satisfies Config;
