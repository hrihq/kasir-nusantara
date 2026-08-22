import { useEffect, useState } from 'react'

export const temaGelap = () => document.documentElement.classList.contains('dark')

export function gantiTema() {
  const gelap = !temaGelap()
  document.documentElement.classList.toggle('dark', gelap)
  try {
    localStorage.setItem('kasir_tema', gelap ? 'gelap' : 'terang')
  } catch {
    /* penyimpanan tidak tersedia */
  }
  window.dispatchEvent(new Event('kasir:tema'))
}

export function pakaiTema() {
  const [gelap, setGelap] = useState(temaGelap)
  useEffect(() => {
    const perbarui = () => setGelap(temaGelap())
    window.addEventListener('kasir:tema', perbarui)
    return () => window.removeEventListener('kasir:tema', perbarui)
  }, [])
  return [gelap, gantiTema]
}
