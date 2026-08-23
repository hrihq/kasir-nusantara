import { useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { rupiah, tanggalLengkap } from '../lib/format.js'
import { t } from '../lib/bahasa.js'
import Ikon from './Ikon.jsx'
import { Modal } from './Modal.jsx'

export default function ShiftKartu() {
  const { shiftAktif, bukaShift, tutupShift, shifts, pengaturan } = useStore()
  const [bukaModal, setBukaModal] = useState(false)
  const [mode, setMode] = useState('buka') // buka | tutup | riwayat
  const [saldoAwal, setSaldoAwal] = useState('')
  const [saldoAkhir, setSaldoAkhir] = useState('')
  const [namaKasir, setNamaKasir] = useState(pengaturan.namaKasir || '')

  const prosesBuka = () => {
    bukaShift(Number(saldoAwal) || 0, namaKasir || 'Kasir')
    setSaldoAwal('')
    setBukaModal(false)
  }

  const prosesTutup = () => {
    tutupShift(Number(saldoAkhir) || 0)
    setSaldoAkhir('')
    setBukaModal(false)
  }

  const selisih = shiftAktif && saldoAkhir
    ? Number(saldoAkhir) - (shiftAktif.saldoAwal + shiftAktif.totalPenjualan - shiftAktif.totalPengeluaran)
    : null

  const riwayat = shifts.filter((s) => s.status === 'tutup').slice(0, 10)

  return (
    <>
      <div className="kartu mx-5 mt-4 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-bold">
              <Ikon nama="keranjang" className="h-4 w-4" />
              {t('Shift Kasir')}
            </div>
            <div className="text-xs text-black/45">
              {shiftAktif
                ? `${t('Aktif')} · ${shiftAktif.kasir} · ${rupiah(shiftAktif.totalPenjualan)}`
                : t('Buka shift sebelum mulai berjualan')}
            </div>
          </div>
          <div className="flex gap-2">
            {shiftAktif ? (
              <button
                onClick={() => { setMode('tutup'); setBukaModal(true) }}
                className="tombol shrink-0 !px-3 !py-2 text-xs ring-1 ring-black/10 hover:bg-krem-tua"
              >
                {t('Tutup')}
              </button>
            ) : (
              <button
                onClick={() => { setMode('buka'); setBukaModal(true) }}
                className="tombol--utama shrink-0 !px-3 !py-2 text-xs"
              >
                {t('Buka Shift')}
              </button>
            )}
            <button
              onClick={() => { setMode('riwayat'); setBukaModal(true) }}
              className="tombol shrink-0 !px-3 !py-2 text-xs ring-1 ring-black/10 hover:bg-krem-tua"
            >
              {t('Riwayat')}
            </button>
          </div>
        </div>
      </div>

      <Modal open={bukaModal} onClose={() => setBukaModal(false)} judul={
        mode === 'buka' ? t('Buka Shift') : mode === 'tutup' ? t('Tutup Shift') : t('Riwayat Shift')
      }>
        {mode === 'buka' && (
          <div className="space-y-3">
            <div>
              <span className="label">{t('Nama Kasir')}</span>
              <input className="input" value={namaKasir} onChange={(e) => setNamaKasir(e.target.value)} placeholder={t('cth. Budi')} />
            </div>
            <div>
              <span className="label">{t('Saldo Awal')}</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-black/40">Rp</span>
                <input type="text" inputMode="numeric" value={saldoAwal} onChange={(e) => setSaldoAwal(e.target.value.replace(/\D/g, ''))} placeholder="0" className="input pl-9 text-lg font-bold" />
              </div>
            </div>
            <button onClick={prosesBuka} className="tombol--utama w-full">{t('Buka Shift')}</button>
          </div>
        )}

        {mode === 'tutup' && shiftAktif && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white p-3 text-xs text-black/60 shadow-kartu space-y-1">
              <div className="flex justify-between"><span>{t('Kasir')}</span><span className="font-semibold">{shiftAktif.kasir}</span></div>
              <div className="flex justify-between"><span>{t('Dibuka')}</span><span>{tanggalLengkap(shiftAktif.waktuBuka)}</span></div>
              <div className="flex justify-between"><span>{t('Penjualan')}</span><span className="font-semibold text-merek">{rupiah(shiftAktif.totalPenjualan)}</span></div>
              <div className="flex justify-between"><span>{t('Transaksi')}</span><span className="font-semibold">{shiftAktif.jumlahTransaksi}</span></div>
            </div>
            <div>
              <span className="label">{t('Saldo Akhir')}</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-black/40">Rp</span>
                <input type="text" inputMode="numeric" value={saldoAkhir} onChange={(e) => setSaldoAkhir(e.target.value.replace(/\D/g, ''))} placeholder="0" className="input pl-9 text-lg font-bold" />
              </div>
              {selisih !== null && (
                <div className={`mt-2 rounded-xl px-3 py-2 text-xs font-semibold ${selisih === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {selisih === 0 ? t('Saldo cocok ✓') : `${selisih > 0 ? t('Lebih') : t('Kurang')} ${rupiah(Math.abs(selisih))}`}
                </div>
              )}
            </div>
            <button onClick={prosesTutup} disabled={!saldoAkhir} className="tombol--utama w-full">{t('Tutup Shift')}</button>
          </div>
        )}

        {mode === 'riwayat' && (
          <div className="max-h-72 overflow-y-auto no-scrollbar space-y-2">
            {riwayat.length === 0 && <p className="py-4 text-center text-xs text-black/40">{t('Belum ada riwayat shift.')}</p>}
            {riwayat.map((s) => (
              <div key={s.id} className="rounded-xl bg-white p-3 text-xs shadow-kartu">
                <div className="flex justify-between font-semibold">
                  <span>{s.kasir}</span>
                  <span>{new Date(s.waktuBuka).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                </div>
                <div className="mt-1 flex justify-between text-black/55">
                  <span>{t('Awal')} {rupiah(s.saldoAwal)}</span>
                  <span>{t('Akhir')} {rupiah(s.saldoAkhir)}</span>
                </div>
                <div className="flex justify-between text-black/55">
                  <span>{t('Penjualan')} {rupiah(s.totalPenjualan)}</span>
                  <span>{s.jumlahTransaksi} {t('trx')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  )
}
