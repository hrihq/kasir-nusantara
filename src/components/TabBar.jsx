import { useLayoutEffect, useRef, useState } from 'react'
import Ikon from './Ikon.jsx'

const TABS = [
  { id: 'kasir', label: 'Kasir', ikon: 'keranjang' },
  { id: 'menu', label: 'Menu', ikon: 'kotak' },
  { id: 'laporan', label: 'Laporan', ikon: 'grafik' },
  { id: 'atur', label: 'Atur', ikon: 'atur' },
]

export default function TabBar({ tab, setTab }) {
  const wadahRef = useRef(null)
  const tombolRefs = useRef({})
  const sentuh = useRef(null)
  const [sorot, setSorot] = useState(null)
  const [kotak, setKotak] = useState(null)

  const target = sorot || tab

  useLayoutEffect(() => {
    const ukur = () => {
      const wadah = wadahRef.current
      const btn = tombolRefs.current[target]
      if (!wadah || !btn) return
      const a = wadah.getBoundingClientRect()
      const b = btn.getBoundingClientRect()
      setKotak({ x: b.left - a.left, y: b.top - a.top, width: b.width, height: b.height })
    }
    ukur()
    window.addEventListener('resize', ukur)
    return () => window.removeEventListener('resize', ukur)
  }, [target])

  const proyeksiIdx = (x, y) => {
    const r = wadahRef.current?.getBoundingClientRect()
    if (!r || !r.width || !r.height) return null
    const vertikal = r.height > r.width
    const f = vertikal ? (y - r.top) / r.height : (x - r.left) / r.width
    const i = Math.floor(f * TABS.length)
    return TABS[Math.min(TABS.length - 1, Math.max(0, i))].id
  }

  const perbaruiSorot = (x, y) => {
    const id = proyeksiIdx(x, y)
    if (sorot !== id) setSorot(id)
  }

  const mulai = (e) => {
    const t = e.touches[0]
    sentuh.current = { x: t.clientX, y: t.clientY }
    perbaruiSorot(t.clientX, t.clientY)
  }

  const gerak = (e) => {
    if (!sentuh.current) return
    const t = e.touches[0]
    perbaruiSorot(t.clientX, t.clientY)
  }

  const akhir = (e) => {
    if (!sentuh.current) return
    const dx = e.changedTouches[0].clientX - sentuh.current.x
    const dy = e.changedTouches[0].clientY - sentuh.current.y
    let arah = 0
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (Math.abs(dx) >= 48) arah = dx < 0 ? 1 : -1
    } else if (Math.abs(dy) >= 48) {
      arah = dy < 0 ? 1 : -1
    }
    const lepasDiTab = sorot
    sentuh.current = null
    setSorot(null)

    let tujuanId = null
    if (lepasDiTab && lepasDiTab !== tab) {
      tujuanId = lepasDiTab
    } else if (arah !== 0) {
      const i = TABS.findIndex((t) => t.id === tab)
      tujuanId = TABS[Math.min(TABS.length - 1, Math.max(0, i + arah))].id
    }
    if (tujuanId && tujuanId !== tab) {
      e.preventDefault()
      setTab(tujuanId)
    }
  }

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))] landscape:inset-x-auto landscape:right-[max(1rem,env(safe-area-inset-right))] landscape:bottom-auto landscape:top-1/2 landscape:-translate-y-1/2 landscape:pb-0">
      <div
        ref={wadahRef}
        onTouchStart={mulai}
        onTouchMove={gerak}
        onTouchEnd={akhir}
        onTouchCancel={() => {
          sentuh.current = null
          setSorot(null)
        }}
        className="pointer-events-auto relative flex w-[calc(100vw-2.5rem)] max-w-[380px] items-center gap-1 rounded-full p-1.5 shadow-kartu ring-1 ring-black/10 backdrop-blur-xl landscape:w-auto landscape:flex-col landscape:rounded-[22px]"
        style={{ backgroundColor: 'var(--permukaan)', ['--tw-ring-color']: 'var(--garis)' }}
      >
        {kotak && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 rounded-full bg-merek shadow-md transition-[transform,width,height] duration-300 ease-out will-change-transform"
            style={{
              width: kotak.width,
              height: kotak.height,
              transform: `translate3d(${kotak.x}px, ${kotak.y}px, 0)`,
            }}
          />
        )}
        {TABS.map((t) => {
          const diAtas = t.id === target
          return (
            <button
              key={t.id}
              data-tab={t.id}
              ref={(el) => {
                tombolRefs.current[t.id] = el
              }}
              onClick={() => setTab(t.id)}
              className="relative z-[1] flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold transition-colors duration-200 active:scale-95"
              style={diAtas ? { color: '#ffffff' } : { color: 'var(--teks)', opacity: 0.55 }}
            >
              <Ikon nama={t.ikon} className="h-[18px] w-[18px]" />
              {t.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
