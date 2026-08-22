import { useEffect, useState } from 'react'

const KUNCI = 'kasir_tema'
const KUNCI_WARNA = 'kasir_tema_warna'
const URUTAN = ['sistem', 'gelap', 'terang']

// Tema warna aksen: mengubah --merek-rgb dll lewat data-tema di <html>
export const TEMA_WARNA = [
  { id: 'klasik', label: 'Klasik', swatch: '#b23b22' },
  { id: 'batik', label: 'Batik', swatch: '#8a5a2b' },
  { id: 'laut', label: 'Laut', swatch: '#0f7690' },
  { id: 'rimba', label: 'Rimba', swatch: '#3d6e2e' },
]

export function bacaTemaWarna() {
  try {
    const t = localStorage.getItem(KUNCI_WARNA)
    return TEMA_WARNA.some((x) => x.id === t) ? t : 'klasik'
  } catch {
    return 'klasik'
  }
}

function terapkanTemaWarna(id) {
  document.documentElement.dataset.tema = id
}

export function aturTemaWarna(id) {
  try {
    localStorage.setItem(KUNCI_WARNA, id)
  } catch {
    /* penyimpanan tidak tersedia */
  }
  terapkanTemaWarna(id)
  window.dispatchEvent(new Event('kasir:tema-warna'))
}

// Ambil warna aksen aktif sebagai string css rgb()/rgba()
let cacheWarna = { rgb: '', waktu: 0 }
export function warnaMerek(alfaNumerik) {
  const kini = Date.now()
  if (!cacheWarna.rgb || kini - cacheWarna.waktu > 500) {
    const gaya = getComputedStyle(document.documentElement)
    cacheWarna = {
      rgb: gaya.getPropertyValue('--merek-rgb').trim() || '178 59 34',
      waktu: kini,
    }
  }
  return alfaNumerik == null
    ? `rgb(${cacheWarna.rgb})`
    : `rgba(${cacheWarna.rgb}, ${alfaNumerik})`
}

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
  terapkanTemaWarna(bacaTemaWarna())
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
