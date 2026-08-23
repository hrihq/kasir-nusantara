import { useEffect, useState } from 'react'

const CEK_URL = 'https://www.gstatic.com/generate_204'
const INTERVAL = 8000

async function cekKoneksi() {
  try {
    const res = await fetch(CEK_URL, { mode: 'no-cors', cache: 'no-store' })
    return true
  } catch {
    return false
  }
}

export default function KoneksiIndicator() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    // Cek langsung saat mount
    cekKoneksi().then(setOnline)

    const interval = setInterval(async () => {
      const hasil = await cekKoneksi()
      setOnline(hasil)
    }, INTERVAL)

    // Dengarkan event bawaan juga
    const on = () => cekKoneksi().then(setOnline)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
        online
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
          : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-red-500'}`}
        style={{ animation: online ? undefined : 'denyut-titik 1.5s infinite' }}
      />
      {online ? 'Online' : 'Offline'}
    </div>
  )
}
