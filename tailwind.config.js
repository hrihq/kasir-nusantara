/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      screens: {
        layar: {
          raw: '(min-width: 1024px), (orientation: landscape) and (min-height: 300px)',
        },
      },
      colors: {
        merek: {
          DEFAULT: 'rgb(var(--merek-rgb) / <alpha-value>)',
          gelap: 'rgb(var(--merek-gelap-rgb) / <alpha-value>)',
          lembut: 'rgb(var(--merek-lembut-rgb) / <alpha-value>)',
        },
        krem: {
          DEFAULT: 'rgb(var(--krem-rgb) / <alpha-value>)',
          tua: 'rgb(var(--krem-tua-rgb) / <alpha-value>)',
        },
        tinta: 'rgb(var(--tinta-rgb) / <alpha-value>)',
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
