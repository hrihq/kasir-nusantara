import { useEffect, useState } from 'react'

export default function PesanPudar({ pesan, onSelesai }) {
  const [memudar, setMemudar] = useState(false)

  useEffect(() => {
    if (!pesan) return undefined
    setMemudar(false)
    const t1 = setTimeout(() => setMemudar(true), 1800)
    const t2 = setTimeout(() => onSelesai?.(), 2350)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pesan])

  if (!pesan) return null
  return (
    <p
      className={`text-center text-xs font-semibold ${
        pesan.ok ? 'text-emerald-600' : 'text-red-500'
      } ${memudar ? 'anim-pudar' : 'anim-muncul'}`}
    >
      {pesan.teks}
    </p>
  )
}
