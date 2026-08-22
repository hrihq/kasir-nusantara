import { useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Modal } from './Modal.jsx'
import { unduhApk, pasangApk, barisCatatan } from '../lib/update.js'
import { t } from '../lib/bahasa.js'

const mb = (b) => `${(b / 1048576).toFixed(1)} MB`

function IkonSelesai() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M20 6 9 17l-5-5" className="anim-garis-centang" />
    </svg>
  )
}

export default function PembaruanModal({ info, tutup }) {
  const [fase, setFase] = useState('awal')
  const [progres, setProgres] = useState(0)
  const [terunduh, setTerunduh] = useState(0)
  const [galat, setGalat] = useState(false)
  const [detailGalat, setDetailGalat] = useState('')
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const mulaiUnduh = async () => {
    if (!Capacitor.isNativePlatform() && !window.__paksaNative) {
      window.open(info.urlUnduh, '_blank')
      return
    }
    setGalat(false)
    setProgres(0)
    setTerunduh(0)
    setFase('mengunduh')
    try {
      await unduhApk(info.urlUnduh, (p, b) => {
        setProgres(p)
        setTerunduh(b)
      })
      setProgres(1)
      setFase('selesai')
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setFase('siap-pasang'), 850)
    } catch (e) {
      setFase('gagal')
      setDetailGalat(e?.message || '')
      setGalat(true)
    }
  }

  const pasang = async () => {
    try {
      await pasangApk()
    } catch (e) {
      setFase('gagal')
      setDetailGalat(e?.message || '')
      setGalat(true)
    }
  }

  const persen = Math.min(100, Math.round(progres * 100))
  const poin = barisCatatan(info?.catatan)
  const tampilkanCatatan =
    (fase === 'awal' || fase === 'gagal' || fase === 'siap-pasang') && poin.length > 0

  return (
    <Modal open={!!info} onClose={tutup} judul={t('Pembaruan Tersedia')}>
      {info && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="" className="h-14 w-14 rounded-2xl shadow-kartu" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-judul text-lg">Versi {info.versi}</span>
                <span className="chip bg-merek-lembut text-merek">{t('Baru')}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--teks)', opacity: 0.55 }}>
                {fase === 'mengunduh'
                  ? `${t('Mengunduh…')} ${terunduh > 0 ? mb(terunduh) : ''}`
                  : fase === 'selesai'
                    ? t('Berkas siap dipasang.')
                    : t('Yang baru dalam versi ini:')}
              </p>
            </div>
          </div>

          <div key={fase} className="anim-muncul space-y-3">
            {tampilkanCatatan && (
              <div className="max-h-44 space-y-2 overflow-y-auto rounded-2xl bg-white p-4 shadow-kartu">
                {poin.map((b, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-black/60">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-merek" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            )}

            {(fase === 'mengunduh' || fase === 'selesai') && (
              <div className="rounded-2xl bg-white p-4 shadow-kartu">
                {fase === 'mengunduh' ? (
                  <>
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-black/50">
                      <span>{t('Menyiapkan berkas pemasangan…')}</span>
                      <span>{persen}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/10">
                      <div
                        className={`h-full rounded-full bg-merek transition-[width] duration-300 ease-out ${
                          progres === 0 ? 'anim-pemuat w-1/3' : ''
                        }`}
                        style={progres > 0 ? { width: `${persen}%` } : undefined}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-white shadow-kartu">
                      <IkonSelesai />
                    </span>
                    <div>
                      <p className="text-sm font-bold">{t('Unduhan Selesai')}</p>
                      <p className="text-xs text-black/50">
                        {terunduh > 0 ? `${mb(terunduh)} · ` : ''}
                        {t('Menyiapkan pemasangan…')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {galat && (
              <>
                <p className="text-center text-xs font-semibold text-red-600">
                  {t('Unduhan gagal setelah mencoba beberapa jalur.')}
                </p>
                {detailGalat && (
                  <p className="text-center text-[10px] text-black/40">{detailGalat}</p>
                )}
              </>
            )}

            {!info.urlUnduh.includes('.apk') && (
              <p className="text-xs text-black/40">{t('Berkas APK belum dilampirkan pada rilis ini.')}</p>
            )}

            {(fase === 'awal' || fase === 'gagal') && info.urlUnduh.includes('.apk') && (
              <button onClick={mulaiUnduh} className="tombol--utama w-full">
                {fase === 'gagal' ? t('Coba Lagi') : t('Unduh Sekarang')}
              </button>
            )}
            {galat && (
              <button
                onClick={() => window.open(info.urlUnduh, '_blank')}
                className="tombol--hantu w-full"
              >
                {t('Unduh lewat Browser')}
              </button>
            )}
            {fase === 'mengunduh' && (
              <button disabled className="tombol--utama w-full opacity-60">
                {t('Mengunduh…')} {persen}%
              </button>
            )}
            {fase === 'siap-pasang' && (
              <button onClick={pasang} className="tombol--utama w-full">
                {t('Pasang Sekarang')}
              </button>
            )}
            {!info.urlUnduh.includes('.apk') && (
              <button onClick={() => window.open(info.urlUnduh, '_blank')} className="tombol--utama w-full">
                {t('Lihat di GitHub')}
              </button>
            )}
            <button onClick={tutup} className="tombol--hantu w-full">
              {t('Nanti Saja')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
