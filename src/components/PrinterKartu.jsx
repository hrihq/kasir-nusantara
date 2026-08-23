import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import Ikon from './Ikon.jsx'
import PesanPudar from './PesanPudar.jsx'
import { Modal } from './Modal.jsx'
import { t } from '../lib/bahasa.js'
import {
  hentikanPemindaian,
  infoPrinter,
  mulaiPemindaian,
  putuskan,
  sambungkan,
  ujiCetak,
} from '../lib/printer.js'

export default function PrinterKartu() {
  const [printer, setPrinter] = useState(infoPrinter())
  const [pilihBuka, setPilihBuka] = useState(false)
  const [temuan, setTemuan] = useState([])
  const [menghubungkan, setMenghubungkan] = useState(null)
  const [pesan, setPesan] = useState(null)
  const [ujian, setUjian] = useState(false)

  if (!Capacitor.isNativePlatform()) return null

  const mulaiCari = async () => {
    setTemuan([])
    setPilihBuka(true)
    try {
      await mulaiPemindaian((perangkat) => {
        if (!perangkat.name) return
        setTemuan((daftar) =>
          daftar.some((d) => d.deviceId === perangkat.deviceId)
            ? daftar
            : [...daftar, perangkat],
        )
      })
    } catch (g) {
      setPesan({ ok: false, teks: `${t('Gagal memindai Bluetooth:')} ${g?.message || ''}` })
      setPilihBuka(false)
    }
  }

  const pilihPerangkat = async (perangkat) => {
    if (menghubungkan) return
    setMenghubungkan(perangkat.deviceId)
    try {
      const hasil = await sambungkan(perangkat)
      setPrinter(hasil)
      setPesan({ ok: true, teks: `${t('Tersambung ke')} ${hasil.nama}` })
      setPilihBuka(false)
    } catch (g) {
      setTemuan([])
      setPesan({ ok: false, teks: `${t('Gagal menyambungkan:')} ${g?.message || ''}` })
    }
    setMenghubungkan(null)
  }

  const jalankanUji = async () => {
    if (ujian) return
    setUjian(true)
    setPesan(null)
    try {
      await ujiCetak({})
      setPesan({ ok: true, teks: t('Struk uji tercetak.') })
    } catch (g) {
      setPrinter(infoPrinter())
      setPesan({ ok: false, teks: `${t('Gagal mencetak:')} ${g?.message || ''}` })
    }
    setUjian(false)
  }

  const tutupPilih = () => {
    hentikanPemindaian()
    setPilihBuka(false)
  }

  return (
    <div className="kartu mx-5 mt-4 space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-bold">
            <Ikon nama="bluetooth" className="h-4 w-4" />
            {t('Printer Thermal')}
          </div>
          <div className="text-xs text-black/45">
            {printer
              ? `${t('Tersambung:')} ${printer.nama}`
              : t('Cetak struk langsung lewat Bluetooth.')}
          </div>
        </div>
        <button onClick={printer ? jalankanUji : mulaiCari} disabled={ujian} className="tombol shrink-0 !px-4 !py-2 text-xs ring-1 ring-black/10 hover:bg-krem-tua">
          {printer ? (ujian ? '…' : t('Uji Cetak')) : t('Sambungkan')}
        </button>
      </div>

      {printer && (
        <button
          onClick={async () => {
            await putuskan()
            setPrinter(null)
          }}
          className="tombol w-full bg-white !py-2 text-xs !text-red-500 ring-1 ring-red-200 hover:bg-red-50"
        >
          {t('Putuskan Printer')}
        </button>
      )}
      <PesanPudar pesan={pesan} onSelesai={() => setPesan(null)} />

      {/* Modal pemilihan perangkat */}
      <Modal open={pilihBuka} onClose={tutupPilih} judul={t('Cari Printer Bluetooth')}>
        <p className="text-sm text-black/55">
          {t('Nyalakan printer lalu pastikan mode Bluetooth pairing aktif.')}
        </p>
        <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto no-scrollbar">
          {temuan.length === 0 && (
            <li className="py-6 text-center text-sm text-black/40">{t('Mencari perangkat…')}</li>
          )}
          {temuan.map((perangkat) => (
            <li key={perangkat.deviceId}>
              <button
                onClick={() => pilihPerangkat(perangkat)}
                disabled={!!menghubungkan}
                className="tombol w-full justify-between bg-white !py-2.5 text-left text-sm font-semibold ring-1 ring-black/10 hover:bg-krem-tua"
              >
                <span className="truncate">{perangkat.name}</span>
                <span className="shrink-0 text-[11px] font-normal text-black/40">
                  {menghubungkan === perangkat.deviceId ? t('Menyambung…') : t('Sambung')}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button onClick={tutupPilih} className="tombol--hantu mt-3 w-full">
          {t('Tutup')}
        </button>
      </Modal>
    </div>
  )
}
