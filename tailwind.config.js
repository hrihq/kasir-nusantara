/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        merek: {
          DEFAULT: '#b23b22',
          gelap: '#8f2e18',
          lembut: '#fbe9e3',
        },
        krem: {
          DEFAULT: '#f7f1e6',
          tua: '#efe5d2',
        },
        tinta: '#241507',
      },
      fontFamily: {
        judul: ['"Bodoni Moda"', 'serif'],
        badan: ['"Albert Sans"', 'sans-serif'],
        struk: ['"Courier New"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        kartu: '0 1px 2px rgba(36,21,7,.05), 0 8px 24px -12px rgba(36,21,7,.18)',
        lembar: '0 -8px 30px rgba(36,21,7,.12)',
      },
    },
  },
  plugins: [],
}
