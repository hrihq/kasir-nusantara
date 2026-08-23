import { useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { t } from '../lib/bahasa.js'
import Ikon from './Ikon.jsx'
import { Modal } from './Modal.jsx'

export default function KtpNfcSheet({ open, onClose }) {
  const { setMembers, diskonList } = useStore()
  const [mode, setMode] = useState(null) // null | 'ktp' | 'nfc'
  const [formKtp, setFormKtp] = useState({ nik: '', nama: '', alamat: '' })
  const [formNfc, setFormNfc] = useState({ kartuId: '', diskonId: '' })
  const [pesan, setPesan] = useState(null)
  const [nfcDibaca, setNfcDibaca] = useState(false)

  // Simulasi baca KTP — ketik NIK lalu nama otomatis terisi
  const simulasiKtp = () => {
    if (!formKtp.nik || formKtp.nik.length < 10) return
    // Simulasi data KTP dari NIK
    const namaSimulasi = 'Pelanggan ' + formKtp.nik.slice(-4)
    setFormKtp((f) => ({ ...f, nama: namaSimulasi, alamat: 'Alamat dari KTP' }))
  }

  const simpanMember = () => {
    if (!formKtp.nama.trim()) return
    setMembers((ms) => [{
      id: Date.now().toString(36),
      nama: formKtp.nama.trim(),
      nik: formKtp.nik.trim(),
      alamat: formKtp.alamat.trim(),
      telepon: '',
      diskonPersen: 0,
      totalBelanja: 0,
      jumlahTransaksi: 0,
      bergabung: new Date().toISOString(),
    }, ...ms])
    setPesan({ ok: true, teks: t('Member berhasil ditambahkan.') })
    setFormKtp({ nik: '', nama: '', alamat: '' })
    setTimeout(() => { setPesan(null); onClose() }, 1500)
  }

  // Simulasi NFC — ketuk kartu, dapat ID, pilih diskon
  const simulasiNfc = () => {
    setNfcDibaca(true)
    setFormNfc({ kartuId: 'NFC-' + Date.now().toString(36).slice(-6).toUpperCase(), diskonId: '' })
  }

  const simpanNfc = () => {
    if (!formNfc.kartuId || !formNfc.diskonId) return
    const diskon = diskonList.find((d) => d.id === formNfc.diskonId)
    setMembers((ms) => {
      const exist = ms.find((m) => m.kartuNfc === formNfc.kartuId)
      if (exist) {
        return ms.map((m) => m.kartuNfc === formNfc.kartuId ? { ...m, diskonPersen: diskon?.nilai || 0 } : m)
      }
      return [{
        id: Date.now().toString(36),
        nama: `Member NFC ${formNfc.kartuId.slice(-4)}`,
        nik: '',
        alamat: '',
        telepon: '',
        kartuNfc: formNfc.kartuId,
        diskonPersen: diskon?.tipe === 'persen' ? diskon.nilai : 0,
        totalBelanja: 0,
        jumlahTransaksi: 0,
        bergabung: new Date().toISOString(),
      }, ...ms]
    })
    setPesan({ ok: true, teks: t('Kartu NFC terdaftar.') })
    setNfcDibaca(false)
    setFormNfc({ kartuId: '', diskonId: '' })
    setTimeout(() => { setPesan(null); onClose() }, 1500)
  }

  const reset = () => {
    setMode(null)
    setFormKtp({ nik: '', nama: '', alamat: '' })
    setFormNfc({ kartuId: '', diskonId: '' })
    setNfcDibaca(false)
    setPesan(null)
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} judul={t('Tambah Member')}>
      {!mode && (
        <div className="space-y-2">
          <button onClick={() => setMode('ktp')} className="tombol w-full items-center gap-3 !py-4 text-left ring-1 ring-black/10 hover:bg-krem-tua">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-merek/10 text-merek">
              <Ikon nama="kunci" className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">{t('Daftar via KTP')}</div>
              <div className="text-[11px] text-black/45">{t('Ketik NIK, nama otomatis terisi')}</div>
            </div>
          </button>
          <button onClick={() => setMode('nfc')} className="tombol w-full items-center gap-3 !py-4 text-left ring-1 ring-black/10 hover:bg-krem-tua">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
              <Ikon nama="bluetooth" className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">{t('Tap Kartu NFC')}</div>
              <div className="text-[11px] text-black/45">{t('Tap kartu untuk daftar diskon otomatis')}</div>
            </div>
          </button>
        </div>
      )}

      {mode === 'ktp' && (
        <div className="space-y-3">
          <button onClick={reset} className="text-xs text-black/45 hover:text-black/70">← {t('Kembali')}</button>
          <div>
            <span className="label">NIK (16 digit)</span>
            <input className="input" value={formKtp.nik} onChange={(e) => setFormKtp((f) => ({ ...f, nik: e.target.value.replace(/\D/g, '').slice(0, 16) }))} placeholder="3201234567890001" inputMode="numeric" onBlur={simulasiKtp} />
          </div>
          <div>
            <span className="label">{t('Nama Lengkap')}</span>
            <input className="input" value={formKtp.nama} onChange={(e) => setFormKtp((f) => ({ ...f, nama: e.target.value }))} placeholder={t('Otomatis terisi dari KTP')} />
          </div>
          <div>
            <span className="label">{t('Alamat')}</span>
            <input className="input" value={formKtp.alamat} onChange={(e) => setFormKtp((f) => ({ ...f, alamat: e.target.value }))} placeholder={t('Otomatis terisi dari KTP')} />
          </div>
          <button onClick={simpanMember} disabled={!formKtp.nama.trim()} className="tombol--utama w-full">{t('Simpan Member')}</button>
        </div>
      )}

      {mode === 'nfc' && (
        <div className="space-y-3">
          <button onClick={reset} className="text-xs text-black/45 hover:text-black/70">← {t('Kembali')}</button>
          {!nfcDibaca ? (
            <button onClick={simulasiNfc} className="tombol w-full items-center justify-center gap-2 !py-4 ring-1 ring-black/10 hover:bg-krem-tua">
              <Ikon nama="bluetooth" className="h-5 w-5 animate-pulse" />
              {t('Tap Kartu Sekarang')}
            </button>
          ) : (
            <>
              <div className="rounded-2xl bg-emerald-50 p-3 text-center">
                <div className="text-xs font-bold text-emerald-700">{t('Kartu terdeteksi!')}</div>
                <div className="mt-1 font-mono text-sm font-bold text-emerald-900">{formNfc.kartuId}</div>
              </div>
              <div>
                <span className="label">{t('Pilih Diskon')}</span>
                <select className="input" value={formNfc.diskonId} onChange={(e) => setFormNfc((f) => ({ ...f, diskonId: e.target.value }))}>
                  <option value="">{t('Tanpa diskon')}</option>
                  {diskonList.filter((d) => d.aktif).map((d) => (
                    <option key={d.id} value={d.id}>{d.nama} — {d.tipe === 'persen' ? `${d.nilai}%` : `Rp${d.nilai}`}</option>
                  ))}
                </select>
              </div>
              <button onClick={simpanNfc} disabled={!formNfc.diskonId} className="tombol--utama w-full">{t('Simpan Kartu')}</button>
            </>
          )}
        </div>
      )}

      {pesan && (
        <div className={`mt-2 rounded-xl px-3 py-2 text-center text-xs font-semibold ${pesan.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {pesan.teks}
        </div>
      )}
    </Modal>
  )
}
