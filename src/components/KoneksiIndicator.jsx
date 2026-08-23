import { useEffect, useState } from 'react'

export default function KoneksiIndicator() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
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
