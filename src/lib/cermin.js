import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'

// Cermin data: salinan semua kunci kasir_* ke berkas di folder Documents.
// Kalau pengguna "bersihkan data" aplikasi, localStorage ikut terhapus —
// tapi berkas di folder publik tetap ada dan dipulihkan otomatis saat start.

const NAMA_BERKAS = 'kasir-data-mirror.json'
const AWALAN = 'kasir_'
export const KUNCI_INTI = ['kasir_produk', 'kasir_transaksi', 'kasir_nomor_urut', 'kasir_member', 'kasir_shift', 'kasir_diskon']

let timerCermin = null

function kumpulkanData() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const kunci = localStorage.key(i)
    if (kunci.startsWith(AWALAN)) data[kunci] = localStorage.getItem(kunci)
  }
  return { aplikasi: 'kasir-nusantara', versiCermin: 1, disimpan: new Date().toISOString(), data }
}

async function tulisCermin() {
  try {
    await Filesystem.writeFile({
      path: NAMA_BERKAS,
      data: JSON.stringify(kumpulkanData()),
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    })
  } catch {
    /* folder tidak bisa ditulis — cadangan manual tetap tersedia */
  }
}

// Dipanggil setiap kali useLocalStorage menyimpan. Didebounce agar tidak
// menulis berkas tiap ketikan.
export function jadwalkanCermin() {
  if (!Capacitor.isNativePlatform()) return
  clearTimeout(timerCermin)
  timerCermin = setTimeout(tulisCermin, 2500)
}

// true = ada cermin yang dipulihkan (localStorage kosong tapi berkas ada)
export async function pulihkanDariCermin() {
  if (!Capacitor.isNativePlatform()) return false
  const masihAda = KUNCI_INTI.some((k) => localStorage.getItem(k) !== null)
  if (masihAda) return false
  try {
    const hasil = await Filesystem.readFile({
      path: NAMA_BERKAS,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    })
    const isi = typeof hasil.data === 'string' ? JSON.parse(hasil.data) : null
    if (!isi || isi.aplikasi !== 'kasir-nusantara' || typeof isi.data !== 'object') return false
    Object.entries(isi.data).forEach(([k, v]) => localStorage.setItem(k, v))
    return true
  } catch {
    return false
  }
}
