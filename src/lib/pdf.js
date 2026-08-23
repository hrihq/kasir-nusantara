import { jsPDF } from 'jspdf'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

const LEBAR_KERTAS = 80 // mm (kertas struk 58mm → lebar A6)
const TINGGI = 200
const MARGIN = 4

const rupiah = (n) => 'Rp' + new Intl.NumberFormat('id-ID').format(Math.round(Number(n) || 0))

function tambahBaris(doc, y, teks, { tengah, tebal, ukuran } = {}) {
  doc.setFontSize(ukuran || 9)
  doc.setFont('courier', tebal ? 'bold' : 'normal')
  if (tengah) {
    doc.text(String(teks), LEBAR_KERTAS / 2, y, { align: 'center' })
  } else {
    doc.text(String(teks), MARGIN, y)
  }
  return y + (ukuran || 9) * 0.4
}

function barisDuaSisi(doc, y, kiri, kanan) {
  doc.setFontSize(9)
  doc.setFont('courier', 'normal')
  doc.text(String(kiri), MARGIN, y)
  doc.text(String(kanan), LEBAR_KERTAS - MARGIN, y, { align: 'right' })
  return y + 3.6
}

function garis(doc, y) {
  doc.setDrawColor(180)
  doc.setLineDashPattern([1, 1], 0)
  doc.line(MARGIN, y, LEBAR_KERTAS - MARGIN, y)
  doc.setLineDashPattern([], 0)
  return y + 2
}

export async function cetakStrukPdf(trx, pengaturan) {
  // Pakai A6 landscape sebagai dasar (105 x 148mm), kita potong nanti
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a6',
  })

  let y = MARGIN + 4

  // Header toko
  const namaToko = pengaturan.namaToko || 'Kasir Nusantara'
  y = tambahBaris(doc, y, namaToko, { tengah: true, tebal: true, ukuran: 12 })
  y += 1
  if (pengaturan.alamat) y = tambahBaris(doc, y, pengaturan.alamat, { tengah: true, ukuran: 8 })
  if (pengaturan.telepon) y = tambahBaris(doc, y, 'Telp. ' + pengaturan.telepon, { tengah: true, ukuran: 8 })
  y += 2

  // Info transaksi
  y = garis(doc, y)
  y = barisDuaSisi(doc, y, 'No.', trx.no)
  const tgl = new Date(trx.tanggal)
  const tglStr = tgl.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  y = barisDuaSisi(doc, y, tglStr, trx.metode === 'QRIS' ? 'QRIS' : 'Tunai')
  y = garis(doc, y)

  // Item
  for (const it of trx.item) {
    y = tambahBaris(doc, y, String(it.nama).slice(0, 30), { ukuran: 8 })
    y = barisDuaSisi(doc, y, `${it.qty} x ${rupiah(it.harga)}`, rupiah(it.qty * it.harga))
    y += 0.5
  }

  y = garis(doc, y)
  y = barisDuaSisi(doc, y, 'Subtotal', rupiah(trx.subtotal))

  if (trx.ppnPersen > 0) {
    y = barisDuaSisi(doc, y, `PPN ${trx.ppnPersen}%`, rupiah(trx.ppnNominal))
  }

  y += 1
  doc.setFontSize(11)
  doc.setFont('courier', 'bold')
  doc.text('TOTAL', MARGIN, y)
  doc.text(rupiah(trx.total), LEBAR_KERTAS - MARGIN, y, { align: 'right' })
  y += 4

  const metodeLabel = trx.metode === 'Tunai' ? 'Tunai' : `Bayar (${trx.metode})`
  y = barisDuaSisi(doc, y, metodeLabel, rupiah(trx.bayar))
  if (trx.metode === 'Tunai') {
    y = barisDuaSisi(doc, y, 'Kembali', rupiah(trx.kembalian))
  }

  y = garis(doc, y)

  // Catatan
  if (pengaturan.catatanStruk) {
    y = tambahBaris(doc, y, pengaturan.catatanStruk, { tengah: true, ukuran: 8 })
    y += 1
  }

  // Footer
  y = tambahBaris(doc, y, '-- Kasir Nusantara --', { tengah: true, ukuran: 7 })

  // Simpan & bagikan
  const namaFile = `struk-${trx.no.replace(/\//g, '-')}.pdf`

  if (Capacitor.isNativePlatform()) {
    // output sebagai ArrayBuffer, convert ke base64
    const arrayBuffer = doc.output('arraybuffer')
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)

    await Filesystem.writeFile({
      path: namaFile,
      data: base64,
      directory: Directory.Cache,
    })
    const fileUri = await Filesystem.getUri({
      path: namaFile,
      directory: Directory.Cache,
    })
    await Share.share({
      title: 'Struk Kasir Nusantara',
      files: [fileUri.uri],
    })
  } else {
    doc.save(namaFile)
  }
}
