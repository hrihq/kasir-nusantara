import { useEffect, useState } from 'react'

const KUNCI = 'kasir_tema'
const URUTAN = ['sistem', 'gelap', 'terang']

export const LABEL_TEMA = {
  sistem: 'Ikut Sistem',
  gelap: 'Gelap',
  terang: 'Terang',
}

export const bacaModeTema = () => {
  try {
    const mode = localStorage.getItem(KUNCI)
    return URUTAN.includes(mode) ? mode : 'sistem'
  } catch {
    return 'sistem'
  }
}

const sistemGelap = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false

export const temaGelap = () => {
  const mode = bacaModeTema()
  return mode === 'gelap' || (mode === 'sistem' && sistemGelap())
}

function terapkan() {
  document.documentElement.classList.toggle('dark', temaGelap())
  window.dispatchEvent(new Event('kasir:tema'))
}

export function aturModeTema(mode) {
  try {
    localStorage.setItem(KUNCI, mode)
  } catch {
    /* penyimpanan tidak tersedia */
  }
  terapkan()
}

export function siklusTema() {
  const berikutnya = URUTAN[(URUTAN.indexOf(bacaModeTema()) + 1) % URUTAN.length]
  aturModeTema(berikutnya)
}

// Nama lama yang masih dipakai beberapa halaman
export const gantiTema = siklusTema

export function initTema() {
  terapkan()
  try {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        if (bacaModeTema() === 'sistem') terapkan()
      })
  } catch {
    /* browser lama tidak mendukung */
  }
}

export function pakaiTema() {
  const [gelap, setGelap] = useState(temaGelap)
  const [mode, setMode] = useState(bacaModeTema)
  useEffect(() => {
    const perbarui = () => {
      setGelap(temaGelap())
      setMode(bacaModeTema())
    }
    window.addEventListener('kasir:tema', perbarui)
    return () => window.removeEventListener('kasir:tema', perbarui)
  }, [])
  return [gelap, siklusTema, mode]
}
