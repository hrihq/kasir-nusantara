import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useLocalStorage } from '../lib/storage.js'
import { produkAwal, memberAwal, diskonAwal, shiftAwal, pengaturanAwal } from '../lib/seed.js'
import { kunciHari, buatId } from '../lib/format.js'

const Konteks = createContext(null)

export const useStore = () => useContext(Konteks)

export function StoreProvider({ children }) {
  const [produk, setProduk] = useLocalStorage('kasir_produk', produkAwal)
  const [transaksi, setTransaksi] = useLocalStorage('kasir_transaksi', [])
  const [pengeluaran, setPengeluaran] = useLocalStorage('kasir_pengeluaran', [])
  const [pengaturan, setPengaturan] = useLocalStorage('kasir_pengaturan', pengaturanAwal)
  const [nomorUrut, setNomorUrut] = useLocalStorage('kasir_nomor_urut', 1)
  const [keranjang, setKeranjang] = useState([])
  const [members, setMembers] = useLocalStorage('kasir_member', memberAwal)
  const [diskonList, setDiskonList] = useLocalStorage('kasir_diskon', diskonAwal)
  const [shifts, setShifts] = useLocalStorage('kasir_shift', shiftAwal)

  // Shift yang sedang aktif (buka)
  const shiftAktif = useMemo(
    () => shifts.find((s) => s.status === 'buka') || null,
    [shifts],
  )

  // Simpan transaksi + kurangi stok + update shift + update member
  const simpanTransaksi = useCallback(
    (rincian) => {
      const sekarang = new Date()
      const no = `INV${kunciHari(sekarang).split('-').join('')}/${String(nomorUrut).padStart(4, '0')}`
      const trx = {
        id: buatId(),
        no,
        tanggal: sekarang.toISOString(),
        ...rincian,
        shiftId: shiftAktif?.id || null,
      }

      // Kurangi stok produk yang terjual (stok null/undefined/-1 = tanpa batas)
      if (rincian.item) {
        setProduk((ps) =>
          ps.map((p) => {
            const item = rincian.item.find((it) => it.id === p.id)
            const s = Number(p.stok)
            if (item && Number.isFinite(s) && s >= 0) {
              return { ...p, stok: Math.max(0, Math.round(s) - item.qty) }
            }
            return p
          }),
        )
      }

      // Update total shift aktif
      if (shiftAktif) {
        setShifts((ss) =>
          ss.map((s) =>
            s.id === shiftAktif.id
              ? {
                  ...s,
                  totalPenjualan: s.totalPenjualan + (rincian.total || 0),
                  jumlahTransaksi: s.jumlahTransaksi + 1,
                }
              : s,
          ),
        )
      }

      // Update statistik member
      if (rincian.memberId) {
        setMembers((ms) =>
          ms.map((m) =>
            m.id === rincian.memberId
              ? {
                  ...m,
                  totalBelanja: m.totalBelanja + (rincian.total || 0),
                  jumlahTransaksi: m.jumlahTransaksi + 1,
                }
              : m,
          ),
        )
      }

      setTransaksi((t) => [trx, ...t])
      setNomorUrut((n) => n + 1)
      return trx
    },
    [nomorUrut, shiftAktif, setTransaksi, setNomorUrut, setProduk, setShifts, setMembers],
  )

  // Buka shift baru
  const bukaShift = useCallback(
    (saldoAwal, namaKasir) => {
      if (shiftAktif) return null
      const shift = {
        id: buatId(),
        kasir: namaKasir || pengaturan.namaKasir || 'Kasir',
        waktuBuka: new Date().toISOString(),
        waktuTutup: null,
        saldoAwal: Number(saldoAwal) || 0,
        saldoAkhir: null,
        totalPenjualan: 0,
        totalPengeluaran: 0,
        jumlahTransaksi: 0,
        status: 'buka',
      }
      setShifts((ss) => [shift, ...ss])
      return shift
    },
    [shiftAktif, pengaturan.namaKasir, setShifts],
  )

  // Tutup shift aktif
  const tutupShift = useCallback(
    (saldoAkhir) => {
      if (!shiftAktif) return null
      const updated = {
        ...shiftAktif,
        waktuTutup: new Date().toISOString(),
        saldoAkhir: Number(saldoAkhir) || 0,
        status: 'tutup',
      }
      setShifts((ss) => ss.map((s) => (s.id === shiftAktif.id ? updated : s)))
      return updated
    },
    [shiftAktif, setShifts],
  )

  const nilai = useMemo(
    () => ({
      produk,
      setProduk,
      transaksi,
      setTransaksi,
      pengeluaran,
      setPengeluaran,
      pengaturan,
      setPengaturan,
      keranjang,
      setKeranjang,
      simpanTransaksi,
      members,
      setMembers,
      diskonList,
      setDiskonList,
      shifts,
      setShifts,
      shiftAktif,
      bukaShift,
      tutupShift,
    }),
    [
      produk, setProduk, transaksi, setTransaksi, pengeluaran, setPengeluaran,
      pengaturan, setPengaturan, keranjang, simpanTransaksi,
      members, setMembers, diskonList, setDiskonList,
      shifts, shiftAktif, bukaShift, tutupShift,
    ],
  )

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>
}
