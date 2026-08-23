import { useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { rupiah, tanggalLengkap } from '../lib/format.js'
import { t } from '../lib/bahasa.js'
import { Modal } from './Modal.jsx'
import Ikon from './Ikon.jsx'

export default function ShiftModal({ buka, tutup }) {
  const { shiftAktif, bukaShift, tutupShift, pengaturan } = useStore()
  const [saldoAwal, setSaldoAwal] = useState('')
  const [saldoAkhir, setSaldoAkhir] = useState('')
  const [namaKasir, setNamaKasir] = useState(pengaturan.namaKasir || '')
  const [tab, setTab] = useState(shiftAktif ? 'tutup' : 'buka')

  const prosesBuka = () => {
    const nominal = Number(saldoAwal) || 0
    bukaShift(nominal, namaKasir || 'Kasir')
    setSaldoAwal('')
    tutup()
  }

  const prosesTutup = () => {
    const nominal = Number(saldoAkhir) || 0
    tutupShift(nominal)
    setSaldoAkhir('')
    tutup()
  }

  const selisih = shiftAktif
    ? Number(saldoAkhir || 0) - (shiftAktif.saldoAwal + shiftAktif.totalPenjualan - shiftAktif.totalPengeluaran)
    : 0

  return (
    <Modal open={buka} onClose={tutup} judul={t('Shift Kasir')}>
      {shiftAktif ? (
        // Shift aktif → tampilkan info + tombol tutup
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-4 text-sm shadow-kartu">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-emerald-700">{t('Shift Sedang Aktif')}</span>
            </div>
            <div className="space-y-1 text-xs text-black/60">
              <div className="flex justify-between">
                <span>{t('Kasir')}</span>
                <span className="font-semibold">{shiftAktif.kasir}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('Dibuka')}</span>
                <span>{tanggalLengkap(shiftAktif.waktuBuka)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('Saldo Awal')}</span>
                <span className="font-semibold">{rupiah(shiftAktif.saldoAwal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('Total Penjualan')}</span>
                <span className="font-semibold text-merek">{rupiah(shiftAktif.totalPenjualan)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('Jumlah Transaksi')}</span>
                <span className="font-semibold">{shiftAktif.jumlahTransaksi}</span>
              </div>
            </div>
          </div>

          <div>
            <span className="label">{t('Saldo Akhir (di kotak kas)')}</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-black/40">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={saldoAkhir}
                onChange={(e) => setSaldoAkhir(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="input pl-9 text-lg font-bold"
              />
            </div>
            {saldoAkhir && (
              <div className={`mt-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                selisih === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              }`}>
                {selisih === 0
                  ? t('Saldo cocok ✓')
                  : `${selisih > 0 ? t('Lebih') : t('Kurang')} ${rupiah(Math.abs(selisih))}`
                }
              </div>
            )}
          </div>

          <button onClick={prosesTutup} disabled={!saldoAkhir} className="tombol--utama w-full">
            {t('Tutup Shift')}
          </button>
        </div>
      ) : (
        // Belum ada shift → form buka baru
        <div className="space-y-3">
          <div>
            <span className="label">{t('Nama Kasir')}</span>
            <input
              className="input"
              value={namaKasir}
              onChange={(e) => setNamaKasir(e.target.value)}
              placeholder={t('cth. Budi')}
            />
          </div>
          <div>
            <span className="label">{t('Saldo Awal (uang di kotak kas)')}</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-black/40">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={saldoAwal}
                onChange={(e) => setSaldoAwal(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="input pl-9 text-lg font-bold"
              />
            </div>
          </div>
          <button onClick={prosesBuka} className="tombol--utama w-full">
            {t('Buka Shift')}
          </button>
        </div>
      )}
    </Modal>
  )
}
