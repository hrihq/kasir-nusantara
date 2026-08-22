import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useLocalStorage } from '../lib/storage.js'
import { produkAwal, pengaturanAwal } from '../lib/seed.js'
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

  const simpanTransaksi = useCallback(
    (rincian) => {
      const sekarang = new Date()
      const no = `INV${kunciHari(sekarang).split('-').join('')}/${String(nomorUrut).padStart(4, '0')}`
      const trx = { id: buatId(), no, tanggal: sekarang.toISOString(), ...rincian }
      setTransaksi((t) => [trx, ...t])
      setNomorUrut((n) => n + 1)
      return trx
    },
    [nomorUrut, setTransaksi, setNomorUrut],
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
    }),
    [produk, transaksi, pengeluaran, pengaturan, keranjang, simpanTransaksi],
  )

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>
}
