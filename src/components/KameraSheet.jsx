import { useEffect, useRef, useState } from 'react'
import { mulaiKamera, mulaiDeteksi, hentikanKamera, dukungPemindai } from '../lib/pemindai.js'
import Ikon from './Ikon.jsx'
import { t } from '../lib/bahasa.js'

// Sheet kamera penuh layar untuk memindai barcode.
// Props: buka (boolean), tutup (fn), onHasil ({ value, format })
export default function KameraSheet({ buka, tutup, onHasil }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const stopDeteksiRef = useRef(null)
  const [salah, setSalah] = useState(null)
  const [siap, setSiap] = useState(false)

  useEffect(() => {
    if (!buka || !dukungPemindai()) return
    let batal = false

    const mulai = async () => {
      setSalah(null)
      setSiap(false)
      try {
        const stream = await mulaiKamera(videoRef.current)
        if (batal) { hentikanKamera(stream); return }
        streamRef.current = stream
        setSiap(true)
        stopDeteksiRef.current = mulaiDeteksi(videoRef.current, (hasil) => {
          navigator.vibrate?.(50)
          onHasil?.(hasil)
        })
      } catch (g) {
        if (!batal)         setSalah(g?.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Aktifkan di pengaturan HP.'
          : 'Gagal membuka kamera.')
      }
    }
    mulai()

    return () => {
      batal = true
      stopDeteksiRef.current?.()
      hentikanKamera(streamRef.current)
      streamRef.current = null
    }
  }, [buka]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!buka) return null

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Tombol tutup */}
      <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10">
        <button
          onClick={tutup}
          className="grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white"
        >
          <Ikon nama="silang" className="h-5 w-5" />
        </button>
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Overlay garis scan */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-52 w-72 max-w-[80vw]">
          {/* Sudut-sudut bingkai */}
          <span className="absolute -left-0.5 -top-0.5 h-6 w-6 rounded-tl-lg border-t-[3px] border-l-[3px] border-merek" />
          <span className="absolute -right-0.5 -top-0.5 h-6 w-6 rounded-tr-lg border-t-[3px] border-r-[3px] border-merek" />
          <span className="absolute -bottom-0.5 -left-0.5 h-6 w-6 rounded-bl-lg border-b-[3px] border-l-[3px] border-merek" />
          <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-br-lg border-b-[3px] border-r-[3px] border-merek" />
          {/* Garis scan animasi */}
          {siap && <div className="scan-line" />}
        </div>
      </div>

      {/* Instruksi / error */}
      <div className="absolute bottom-0 inset-x-0 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-xs text-center">
          {salah ? (
            <p className="text-sm font-semibold text-red-400">{t(salah)}</p>
          ) : (
            <p className="text-sm font-semibold text-white drop-shadow">
              {siap ? t('Arahkan kamera ke barcode barang') : '…'}
            </p>
          )}
          <button
            onClick={tutup}
            className="tombol--hantu mt-3 !text-white !ring-white/30 hover:!bg-white/10"
          >
            {t('Batal')}
          </button>
        </div>
      </div>
    </div>
  )
}
