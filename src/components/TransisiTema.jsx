import { t } from '../lib/bahasa.js'

// Overlay transisi tema: progress bar + emoji senyum bergerak.
// tampil: true = fade in · 'keluar' = fade out · falsy = tersembunyi.
// Selalu di tengah, baik portrait maupun landscape (fixed inset + flex center).
export default function TransisiTema({ tampil }) {
  if (!tampil) return null
  const keluar = tampil === 'keluar'
  return (
    <div
      className={`fixed inset-0 z-[120] flex flex-col items-center justify-center gap-7 ${
        keluar ? 'anim-padam pointer-events-none' : 'anim-muncul'
      }`}
      style={{ background: 'var(--latar)' }}
      aria-live="polite"
    >
      <div className="w-56 max-w-[70vw]">
        {/* Rel emoji di atas bar */}
        <div className="relative mb-2 h-9">
          <span className="emoji-transisi absolute top-0 text-3xl leading-none">😊</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div className="bar-transisi h-full rounded-full bg-merek" />
        </div>
        <p
          className="anim-naik mt-3 text-center text-sm font-semibold tracking-wide"
          style={{ color: 'var(--teks)', opacity: 0.55 }}
        >
          {t('Tunggu sebentar…')}
        </p>
      </div>
    </div>
  )
}
