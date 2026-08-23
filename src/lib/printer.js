import { BleClient } from '@capacitor-community/bluetooth-le'

const KUNCI = 'kasir_printer'
const LEBAR = 32 // karakter per baris, kertas struk 58mm

// UUID layanan/karakteristik yang dipakai kebanyakan printer thermal
// Bluetooth murah (EPPOS, Codesoft, Xprinter, Goojprt, dll).
const KANDIDAT = [
  ['0000ff00-0000-1000-8000-00805f9b34fb', '0000ff02-0000-1000-8000-00805f9b34fb'],
  ['000018f0-0000-1000-8000-00805f9b34fb', '00002af1-0000-1000-8000-00805f9b34fb'],
  ['0000ae00-0000-1000-8000-00805f9b34fb', '0000ae10-0000-1000-8000-00805f9b34fb'],
  ['0000ffe0-0000-1000-8000-00805f9b34fb', '0000ffe1-0000-1000-8000-00805f9b34fb'],
]

const bacaTersimpan = () => {
  try {
    return JSON.parse(localStorage.getItem(KUNCI)) || null
  } catch {
    return null
  }
}
const simpanTersimpan = (nilai) => localStorage.setItem(KUNCI, JSON.stringify(nilai))

export const infoPrinter = bacaTersimpan

let siap = false
async function pastikanSiap() {
  if (!siap) {
    await BleClient.initialize({ androidNeverForLocation: true })
    siap = true
  }
}

// Pindai perangkat BLE di sekitar; panggil hentikanPemindaian() setelah selesai.
export async function mulaiPemindaian(onTemuan) {
  await pastikanSiap()
  return BleClient.scanForPeripherals([], (hasil) => onTemuan(hasil.device))
}

export async function hentikanPemindaian() {
  try {
    await BleClient.stopLEScan()
  } catch {
    /* belum memindai */
  }
}

function pilihKarakteristik(layananList) {
  const semua = []
  for (const s of layananList || []) {
    for (const c of s.characteristics || []) {
      if (c.properties?.write || c.properties?.writeWithoutResponse) {
        semua.push([s.uuid, c.uuid])
      }
    }
  }
  // Utamakan UUID yang dikenal sebagai jalur data printer
  for (const pasangan of KANDIDAT) {
    const cocok = semua.find(([s, c]) => s === pasangan[0] && c === pasangan[1])
    if (cocok) return { layanan: cocok[0], karakteristik: cocok[1] }
  }
  if (semua.length > 0) return { layanan: semua[0][0], karakteristik: semua[0][1] }
  throw new Error('Perangkat tidak punya karakteristik cetak')
}

// Sambungkan ke deviceId hasil pemindaian. Simpan pilihan agar bisa cetak langsung.
export async function sambungkan(perangkat) {
  await pastikanSiap()
  await hentikanPemindaian()
  await BleClient.connect(perangkat.deviceId, () => {
    // koneksi terputus — hapus status agar UI tahu
    const sekarang = bacaTersimpan()
    if (sekarang?.id === perangkat.deviceId) simpanTersimpan(null)
  })
  const layananList = await BleClient.getServices(perangkat.deviceId)
  const jalur = pilihKarakteristik(layananList)
  simpanTersimpan({
    id: perangkat.deviceId,
    nama: perangkat.name || 'Printer Bluetooth',
    ...jalur,
  })
  return bacaTersimpan()
}

export async function putuskan() {
  const p = bacaTersimpan()
  simpanTersimpan(null)
  if (p?.id && siap) {
    try {
      await BleClient.disconnect(p.id)
    } catch {
      /* sudah terputus */
    }
  }
}

const ENCODER = new TextEncoder()

async function tulis(p, bytes) {
  // Kirim bertahap — printer thermal hanya sanggup menerima potongan kecil
  const UKURAN = 180
  for (let i = 0; i < bytes.length; i += UKURAN) {
    const potongan = bytes.slice(i, i + UKURAN)
    await BleClient.write(
      p.id,
      p.layanan,
      p.karakteristik,
      potongan.buffer.slice(potongan.byteOffset, potongan.byteOffset + potongan.byteLength),
    )
    await new Promise((r) => setTimeout(r, 25))
  }
}

const rataKanan = (kiri, kanan) => {
  kiri = String(kiri).slice(0, LEBAR - 1)
  kanan = String(kanan)
  const ruang = Math.max(1, LEBAR - kiri.length - kanan.length)
  return kiri + ' '.repeat(ruang) + kanan
}
const tengah = (teks) => {
  teks = String(teks)
  if (teks.length >= LEBAR) return teks
  const kiri = Math.floor((LEBAR - teks.length) / 2)
  return ' '.repeat(kiri) + teks
}
const pembatas = () => '-'.repeat(LEBAR)

// Baris perintah ESC/POS mentah (inisialisasi, rata, tebal, ukuran ganda)
const CMD = {
  init: [27, 64],
  tengah: [27, 97, 49],
  kiri: [27, 97, 48],
  tebalOn: [27, 69, 49],
  tebalOff: [27, 69, 48],
  besarOn: [29, 33, 17],
  besarOff: [29, 33, 0],
  umpan: [27, 100, 4],
}

async function cetakBaris(p, bagian) {
  const bytes = []
  for (const b of bagian) {
    if (Array.isArray(b)) bytes.push(...b)
    else bytes.push(...ENCODER.encode(b), 10) // 10 = newline
  }
  await tulis(p, new Uint8Array(bytes))
}

// Cetak isi struk transaksi ke printer Bluetooth yang tersambung.
export async function cetakStruk(trx, pengaturan) {
  const p = bacaTersimpan()
  if (!p) throw new Error('Belum ada printer tersambung')

  const rupiah = (n) => 'Rp' + new Intl.NumberFormat('id-ID').format(Math.round(Number(n) || 0))
  const metode = trx.metode === 'QRIS' ? 'QRIS' : 'Tunai'
  const tanggal = new Date(trx.tanggal).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  await cetakBaris(p, [CMD.init, CMD.tengah, CMD.tebalOn, CMD.besarOn, pengaturan.namaToko || 'Kasir'])
  const bagian = [
    [CMD.besarOff, CMD.tebalOff],
  ]
  if (pengaturan.alamat) bagian.push(pengaturan.alamat.slice(0, LEBAR))
  if (pengaturan.telepon) bagian.push('Telp. ' + pengaturan.telepon)
  bagian.push(pembatas(), rataKanan('No.', trx.no), tanggal + '  ' + metode, pembatas())
  for (const it of trx.item) {
    bagian.push(String(it.nama).slice(0, LEBAR))
    bagian.push(rataKanan(`${it.qty} x ${rupiah(it.harga)}`, rupiah(it.qty * it.harga)))
  }
  bagian.push(
    pembatas(),
    rataKanan('Subtotal', rupiah(trx.subtotal)),
  )
  if (trx.ppnPersen > 0) bagian.push(rataKanan(`PPN ${trx.ppnPersen}%`, rupiah(trx.ppnNominal)))
  bagian.push([CMD.tebalOn], rataKanan('TOTAL', rupiah(trx.total)), [CMD.tebalOff])
  bagian.push(rataKanan(metode === 'Tunai' ? metode : `Bayar (${metode})`, rupiah(trx.bayar)))
  if (metode === 'Tunai') bagian.push(rataKanan('Kembali', rupiah(trx.kembalian)))
  bagian.push(
    pembatas(),
    [CMD.tengah],
  )
  if (pengaturan.catatanStruk) bagian.push(String(pengaturan.catatanStruk).slice(0, LEBAR * 2))
  bagian.push('-- Kasir Nusantara --', [CMD.umpan])

  await cetakBaris(p, bagian)
}

// Struk uji untuk memastikan kertas & koneksi benar.
export async function ujiCetak(pengaturan) {
  const p = bacaTersimpan()
  if (!p) throw new Error('Belum ada printer tersambung')
  await cetakBaris(p, [
    CMD.init,
    CMD.tengah,
    CMD.tebalOn,
    CMD.besarOn,
    pengaturan.namaToko || 'Kasir Nusantara',
    CMD.besarOff,
    CMD.tebalOff,
    '',
    'Uji cetak berhasil.',
    'Printer siap digunakan.',
    '',
    '-- Kasir Nusantara --',
    [CMD.umpan],
  ])
}
