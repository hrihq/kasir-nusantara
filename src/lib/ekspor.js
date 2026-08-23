import * as XLSX from 'xlsx'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { kunciHari } from './format.js'

function kunci(iso) {
  return kunciHari(new Date(iso))
}

function formatRp(n) {
  return Number(n) || 0
}

// Lebar kolom otomatis berdasarkan isi header + data
function lebarKolom(sheet) {
  const lebar = {}
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  for (let c = range.s.c; c <= range.e.c; c++) {
    let maks = 8
    for (let r = range.s.r; r <= Math.min(range.e.r, 100); r++) {
      const sel = sheet[XLSX.utils.encode_cell({ r, c })]
      if (sel?.v != null) {
        maks = Math.max(maks, String(sel.v).length + 2)
      }
    }
    lebar[XLSX.utils.encode_col(c)] = Math.min(maks, 40)
  }
  sheet['!cols'] = Object.entries(lebar).map(([, w]) => ({ wch: w }))
}

export async function eksporExcel({ transaksi, pengeluaran, hari, namaFile }) {
  const omzet = transaksi.reduce((a, t) => a + t.total, 0)
  const beban = pengeluaran.reduce((a, e) => a + e.jumlah, 0)

  // === Sheet 1: Ringkasan (tabel rapi) ===
  const ringkasanData = [
    ['LAPORAN KASIR NUSANTARA'],
    ['Periode', `${hari[0]?.label || '-'} s/d ${hari[hari.length - 1]?.label || '-'}`],
    [],
    ['Keterangan', 'Nilai'],
    ['Total Pemasukan', omzet],
    ['Total Pengeluaran', beban],
    ['Laba Bersih', omzet - beban],
    ['Jumlah Transaksi', transaksi.length],
  ]
  const wsRingkasan = XLSX.utils.aoa_to_sheet(ringkasanData)
  // Merge judul
  wsRingkasan['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
  ]
  lebarKolom(wsRingkasan)

  // === Sheet 2: Harian ===
  const harianData = hari.map((h) => {
    const omzetH = transaksi
      .filter((t) => kunci(t.tanggal) === h.kunci)
      .reduce((a, t) => a + t.total, 0)
    const bebanH = pengeluaran
      .filter((e) => kunci(e.tanggal) === h.kunci)
      .reduce((a, e) => a + e.jumlah, 0)
    return {
      Tanggal: h.label,
      Pemasukan: formatRp(omzetH),
      Pengeluaran: formatRp(bebanH),
      Laba: formatRp(omzetH - bebanH),
    }
  })
  const wsHarian = XLSX.utils.json_to_sheet(harianData)
  lebarKolom(wsHarian)

  // === Sheet 3: Transaksi ===
  const trxData = transaksi.map((t) => ({
    'No. Invoice': t.no,
    Tanggal: new Date(t.tanggal).toLocaleString('id-ID'),
    Metode: t.metode,
    Subtotal: formatRp(t.subtotal),
    [`PPN ${t.ppnPersen || 0}%`]: formatRp(t.ppnNominal),
    Total: formatRp(t.total),
  }))
  const wsTrx = trxData.length ? XLSX.utils.json_to_sheet(trxData) : XLSX.utils.aoa_to_sheet([['Belum ada transaksi']])
  lebarKolom(wsTrx)

  // === Sheet 4: Rincian Item ===
  const itemData = transaksi.flatMap((t) =>
    t.item.map((it) => ({
      'No. Invoice': t.no,
      Menu: it.nama,
      Qty: it.qty,
      'Harga Satuan': formatRp(it.harga),
      Jumlah: formatRp(it.qty * it.harga),
    })),
  )
  const wsItem = itemData.length ? XLSX.utils.json_to_sheet(itemData) : XLSX.utils.aoa_to_sheet([['Belum ada rincian']])
  lebarKolom(wsItem)

  // === Sheet 5: Pengeluaran ===
  const bebanData = pengeluaran.map((e) => ({
    Tanggal: new Date(e.tanggal).toLocaleDateString('id-ID'),
    Keterangan: e.judul,
    Jumlah: formatRp(e.jumlah),
  }))
  const wsBeban = bebanData.length ? XLSX.utils.json_to_sheet(bebanData) : XLSX.utils.aoa_to_sheet([['Belum ada pengeluaran']])
  lebarKolom(wsBeban)

  // Susun workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsRingkasan, 'Ringkasan')
  XLSX.utils.book_append_sheet(wb, wsHarian, 'Harian')
  XLSX.utils.book_append_sheet(wb, wsTrx, 'Transaksi')
  XLSX.utils.book_append_sheet(wb, wsItem, 'Rincian Item')
  XLSX.utils.book_append_sheet(wb, wsBeban, 'Pengeluaran')

  // Tulis sebagai base64
  const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })

  if (Capacitor.isNativePlatform()) {
    // Tulis binary langsung (bukan UTF8) — .xlsx adalah biner
    await Filesystem.writeFile({
      path: namaFile,
      data: base64,
      directory: Directory.Cache,
    })
    await Share.share({
      title: 'Laporan Kasir Nusantara',
      files: [`cache/${namaFile}`],
      dialogTitle: 'Bagikan atau simpan laporan Excel',
    })
    return 'dibagikan'
  }

  // Web: unduh
  const bin = atob(base64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  const url = URL.createObjectURL(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
  )
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
