import { useEffect, useState } from 'react'
import { Modal } from './Modal.jsx'
import { VERSI, ambilCatatanVersi, barisCatatan } from '../lib/update.js'
import { t } from '../lib/bahasa.js'

export default function CatatanRilisModal({ buka, tutup }) {
  const [poin, setPoin] = useState(null)

  useEffect(() => {
    if (!buka) return
    let hidup = true
    setPoin(null)
    ambilCatatanVersi(VERSI).then((teks) => {
      if (hidup) setPoin(barisCatatan(teks))
    })
    return () => {
      hidup = false
    }
  }, [buka])

  return (
    <Modal open={!!buka} onClose={tutup} judul={t('Aplikasi Diperbarui')}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-500 text-white shadow-kartu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold">{t('Aplikasi Diperbarui')}</p>
            <p className="text-xs" style={{ color: 'var(--teks)', opacity: 0.55 }}>
              {t('Aplikasi baru saja diperbarui ke versi')} v{VERSI}
            </p>
          </div>
        </div>

        {poin === null ? (
          <div className="rounded-2xl bg-white p-4 text-sm text-black/45 shadow-kartu">…</div>
        ) : poin.length > 0 ? (
          <div className="max-h-52 space-y-2 overflow-y-auto rounded-2xl bg-white p-4 shadow-kartu">
            <p className="text-xs font-bold uppercase tracking-wide text-black/40">
              {t('Yang baru dalam versi ini:')}
            </p>
            {poin.map((b, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-black/60">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-merek" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-black/50">{t('Aplikasi sudah versi terbaru')}.</p>
        )}

        <button onClick={tutup} className="tombol--utama w-full">
          {t('Lanjut')}
        </button>
      </div>
    </Modal>
  )
}
