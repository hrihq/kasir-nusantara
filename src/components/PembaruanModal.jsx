import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Modal } from './Modal.jsx'
import { unduhApk, pasangApk } from '../lib/update.js'

const barisCatatan = (teks) =>
  String(teks || '')
    .split('\n')
    .map((b) =>
      b
        .trim()
        .replace(/^#{1,6}\s*/, '')
        .replace(/^[-*]+\s*/, '')
        .replace(/\*\*/g, '')
        .replace(/`/g, ''),
    )
    .filter((b) => b && !/^(what.?s changed|full changelog)/i.test(b))

const mb = (b) => `${(b / 1048576).toFixed(1)} MB`

export default function PembaruanModal({ info, tutup }) {
  const [fase, setFase] = useState('awal')
  const [progres, setProgres] = useState(0)
  const [terunduh, setTerunduh] = useState(0)
  const [galat, setGalat] = useState(false)
  const [detailGalat, setDetailGalat] = useState('')

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
      setFase('siap-pasang')
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

  return (
    <Modal open={!!info} onClose={tutup} judul="Pembaruan Tersedia">
      {info && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="" className="h-14 w-14 rounded-2xl shadow-kartu" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-judul text-lg">Versi {info.versi}</span>
                <span className="chip bg-merek-lembut text-merek">Baru</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--teks)', opacity: 0.55 }}>
                {fase === 'mengunduh'
                  ? `Mengunduh… ${terunduh > 0 ? mb(terunduh) : ''}`
                  : 'Yang baru dalam versi ini:'}
              </p>
            </div>
          </div>

          {fase !== 'mengunduh' && poin.length > 0 && (
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-2xl bg-white p-4 shadow-kartu">
              {poin.map((b, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-black/60">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-merek" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          )}

          {fase === 'mengunduh' && (
            <div className="rounded-2xl bg-white p-4 shadow-kartu">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-black/50">
                <span>Menyiapkan berkas pemasangan…</span>
                <span>{persen}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/10">
                <div
                  className={`h-full rounded-full bg-merek transition-[width] duration-200 ${
                    progres === 0 ? 'anim-pemuat w-1/3' : ''
                  }`}
                  style={progres > 0 ? { width: `${persen}%` } : undefined}
                />
              </div>
            </div>
          )}

          {galat && (
            <>
              <p className="text-center text-xs font-semibold text-red-600">
                Unduhan gagal setelah mencoba beberapa jalur.
              </p>
              {detailGalat && (
                <p className="text-center text-[10px] text-black/40">{detailGalat}</p>
              )}
            </>
          )}

          {!info.urlUnduh.includes('.apk') && (
            <p className="text-xs text-black/40">Berkas APK belum dilampirkan pada rilis ini.</p>
          )}

          {(fase === 'awal' || fase === 'gagal') && info.urlUnduh.includes('.apk') && (
            <button onClick={mulaiUnduh} className="tombol--utama w-full">
              {fase === 'gagal' ? 'Coba Lagi' : 'Unduh Sekarang'}
            </button>
          )}
          {galat && (
            <button
              onClick={() => window.open(info.urlUnduh, '_blank')}
              className="tombol--hantu w-full"
            >
              Unduh lewat Browser
            </button>
          )}
          {fase === 'mengunduh' && (
            <button disabled className="tombol--utama w-full opacity-60">
              Mengunduh… {persen}%
            </button>
          )}
          {fase === 'siap-pasang' && (
            <button onClick={pasang} className="tombol--utama w-full">
              Pasang Sekarang
            </button>
          )}
          {!info.urlUnduh.includes('.apk') && (
            <button onClick={() => window.open(info.urlUnduh, '_blank')} className="tombol--utama w-full">
              Lihat di GitHub
            </button>
          )}
          <button onClick={tutup} className="tombol--hantu w-full">
            Nanti Saja
          </button>
        </div>
      )}
    </Modal>
  )
}

