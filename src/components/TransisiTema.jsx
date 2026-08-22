import { t } from '../lib/bahasa.js'

export default function TransisiTema({ tampil }) {
  if (!tampil) return null
  return (
    <div
      className="anim-muncul fixed inset-0 z-[120] flex flex-col items-center justify-center gap-6"
      style={{ background: 'var(--latar)' }}
      aria-live="polite"
    >
      <span className="cincin-tema block h-14 w-14 rounded-full" />
      <p className="anim-naik text-sm font-semibold tracking-wide" style={{ color: 'var(--teks)', opacity: 0.55 }}>
        {t('Tunggu sebentar…')}
      </p>
    </div>
  )
}
