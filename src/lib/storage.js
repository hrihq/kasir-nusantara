import { useEffect, useState } from 'react'

export function useLocalStorage(kunci, awal) {
  const [nilai, setNilai] = useState(() => {
    try {
      const mentah = localStorage.getItem(kunci)
      return mentah != null ? JSON.parse(mentah) : awal
    } catch {
      return awal
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(kunci, JSON.stringify(nilai))
    } catch {
      /* penyimpanan penuh — abaikan */
    }
  }, [kunci, nilai])

  return [nilai, setNilai]
}
