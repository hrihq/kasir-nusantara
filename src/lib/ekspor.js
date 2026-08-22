import * as XLSX from 'xlsx'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { kunciHari } from './format.js'

function lembarHarian(transaksi, pengeluaran, hari) {
  return hari.map((h) => {
    const omzet = transaksi
      .filter((t) => kunci(t.tanggal) === h.kunci)
      .reduce((a, t) => a + t.total, 0)
    const beban = pengeluaran
      .filter((e) => kunci(e.tanggal) === h.kunci)
      .reduce((a, e) => a + e.jumlah, 0)
    return { Tanggal: h.label, Pemasukan: omzet, Pengeluaran: beban, Laba: omzet - beban }
  })
}

function kunci(iso) {
  return kunciHari(new Date(iso))
}

export async function eksporExcel({ transaksi, pengeluaran, hari, namaFile }) {
  const omzet = transaksi.reduce((a, t) => a + t.total, 0)
  const beban = pengeluaran.reduce((a, e) => a + e.jumlah, 0)

  const ringkasan = [
    ['Laporan Kasir Nusantara'],
    [`Periode: ${hari[0]?.label} s/d ${hari[hari.length - 1]?.label}`],
    [],
    ['Total Pemasukan', omzet],
    ['Total Pengeluaran', beban],
    ['Laba Bersih', omzet - beban],
    ['Jumlah Transaksi', transaksi.length],
  ]

  const daftarTransaksi = transaksi.map((t) => ({
    'No. Invoice': t.no,
    Tanggal: new Date(t.tanggal).toLocaleString('id-ID'),
    Metode: t.metode,
    Subtotal: t.subtotal,
    [`PPN ${t.ppnPersen}%`]: t.ppnNominal,
    Total: t.total,
  }))

  const rincianItem = transaksi.flatMap((t) =>
    t.item.map((it) => ({
      'No. Invoice': t.no,
      Menu: it.nama,
      Qty: it.qty,
      'Harga Satuan': it.harga,
      Jumlah: it.qty * it.harga,
    })),
  )

  const daftarBeban = pengeluaran.map((e) => ({
    Tanggal: new Date(e.tanggal).toLocaleDateString('id-ID'),
    Keterangan: e.judul,
    Jumlah: e.jumlah,
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ringkasan), 'Ringkasan')
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(lembarHarian(transaksi, pengeluaran, hari)),
    'Harian',
  )
  if (daftarTransaksi.length)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(daftarTransaksi), 'Transaksi')
  if (rincianItem.length)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rincianItem), 'Rincian Item')
  if (daftarBeban.length)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(daftarBeban), 'Pengeluaran')

  const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })

  if (Capacitor.isNativePlatform()) {
    const hasil = await Filesystem.writeFile({
      path: namaFile,
      data: base64,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })
    await Share.share({
      title: 'Laporan Keuangan',
      url: hasil.uri,
      dialogTitle: 'Bagikan atau simpan laporan Excel',
    })
    return 'dibagikan'
  }

  const bin = window.atob(base64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.ms-excel' }))
  const a = document.createElement('a')
  a.href = url
  a.download = namaFile
  a.click()
  URL.revokeObjectURL(url)
  return 'diunduh'
}

export function namaBerkasLaporan() {
  const kini = new Date()
  const stempel = `${kini.getFullYear()}${String(kini.getMonth() + 1).padStart(2, '0')}${String(
    kini.getDate(),
  ).padStart(2, '0')}`
  return `Laporan-Kasir-${stempel}.xlsx`
}
