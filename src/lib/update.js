import { Capacitor, registerPlugin } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { LocalNotifications } from '@capacitor/local-notifications'
import { t } from './bahasa.js'
import pkg from '../../package.json'

export const VERSI = pkg.version

const GITHUB_REPO = 'hrihq/kasir-nusantara'

export const NAMA_FILE_APK = 'KasirNusantara-pembaruan.apk'
const NAMA_FILE_RILIS = 'rilis-terbaru.json'

export const PembukaApk = registerPlugin('PembukaApk')

const bandingkanVersi = (a, b) => {
  const pa = String(a).split('.').map(Number)
  const pb = String(b).split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0) ? 1 : -1
  }
  return 0
}

// Jalur API berurutan: resmi → cermin (untuk ISP yang memblokir GitHub)
const RUTE_RILIS = [
  (repo) => `https://api.github.com/repos/${repo}/releases/latest`,
  (repo) => `https://gh-proxy.com/https://api.github.com/repos/${repo}/releases/latest`,
  (repo) => `https://ghp.ci/https://api.github.com/repos/${repo}/releases/latest`,
]

const olahRilis = (data) => {
  const versi = String(data?.tag_name || '').replace(/^v/i, '')
  if (!versi || bandingkanVersi(versi, VERSI) <= 0) return null
  const apk = (data.assets || []).find((a) => a.name.toLowerCase().endsWith('.apk'))
  return {
    versi,
    catatan: data.body || '',
    urlUnduh: apk ? apk.browser_download_url : data.html_url,
  }
}

export async function cekPembaruan() {
  if (!GITHUB_REPO || GITHUB_REPO.includes('USERNAME')) return null
  // 1) fetch biasa lewat beberapa jalur
  for (const rute of RUTE_RILIS) {
    try {
      const res = await fetch(rute(GITHUB_REPO), {
        headers: { Accept: 'application/vnd.github+json' },
      })
      if (!res.ok) continue
      const data = await res.json()
      const hasil = olahRilis(data)
      if (hasil) return hasil
      if (data?.tag_name) return null // respons sah — memang belum ada yang lebih baru
    } catch {
      /* coba jalur berikutnya */
    }
  }
  // 2) native: tarik JSON lewat plugin — bebas blokir CORS/ISP WebView
  if (Capacitor.isNativePlatform()) {
    for (const rute of RUTE_RILIS) {
      try {
        await PembukaApk.unduh({ url: rute(GITHUB_REPO), file: NAMA_FILE_RILIS })
        const f = await Filesystem.readFile({
          path: NAMA_FILE_RILIS,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        })
        const data = JSON.parse(typeof f.data === 'string' ? f.data : atob(f.data))
        const hasil = olahRilis(data)
        if (hasil) return hasil
        if (data?.tag_name) return null
      } catch {
        /* coba jalur berikutnya */
      }
    }
  }
  return null
}

export const besok = () => {
  const d = new Date(Date.now() + 86400000)
  const dua = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`
}

export function sudahDitunda(pengaturan) {
  const s = pengaturan?.tundaUpdateSampai
  if (!s) return false
  return new Date(`${s}T23:59:59`) >= new Date()
}

const blobKeBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] || '')
    r.onerror = () => reject(new Error('Gagal membaca berkas'))
    r.readAsDataURL(blob)
  })

// Cermin untuk mengatasi ISP yang memblokir/membatasi CDN GitHub
const CERMIN = ['https://gh-proxy.com/', 'https://ghp.ci/']

const BATAS_MANDEK = 20000 // ms tanpa data baru → anggap jalur macet

async function unduhSatu(url, onProgres, info) {
  if (Capacitor.isNativePlatform()) {
    const langganan = await PembukaApk.addListener('progres', (d) => {
      onProgres?.(d.total ? d.terunduh / d.total : 0, d.terunduh, info)
    })
    try {
      await PembukaApk.unduh({ url, file: NAMA_FILE_APK })
    } finally {
      langganan.remove()
    }
    return
  }
  const kendali = new AbortController()
  const pengawas = setInterval(() => {}, 1000)
  let terakhir = Date.now()
  const segar = () => {
    terakhir = Date.now()
  }
  kendali.signal.addEventListener('abort', segar)
  const penjagaMandek = setInterval(() => {
    if (Date.now() - terakhir > BATAS_MANDEK) kendali.abort()
  }, 1000)
  try {
    const res = await fetch(url, { signal: kendali.signal })
    if (!res.ok) throw new Error('Unduhan gagal')
    const total = Number(res.headers.get('content-length')) || 0
    const reader = res.body.getReader()
    const bagian = []
    let terunduh = 0
    for (;;) {
      const tunggu = Promise.race([
        reader.read(),
        new Promise((_, tolak) =>
          setTimeout(() => {
            kendali.abort()
            tolak(new Error('Jeda terlalu lama'))
          }, BATAS_MANDEK),
        ),
      ])
      const { done, value } = await tunggu
      segar()
      if (done) break
      bagian.push(value)
      terunduh += value.length
      onProgres?.(total ? terunduh / total : 0, terunduh, info)
    }
    clearInterval(penjagaMandek)
    clearInterval(pengawas)
    await Filesystem.writeFile({
      path: NAMA_FILE_APK,
      data: await blobKeBase64(new Blob(bagian, { type: 'application/vnd.android.package-archive' })),
      directory: Directory.Cache,
    })
    return
  } catch (e) {
    clearInterval(penjagaMandek)
    clearInterval(pengawas)
    throw e
  }
}

export async function unduhApk(url, onProgres) {
  const daftarUrl = [url, ...CERMIN.map((m) => m + url)]
  let galatTerakhir
  for (let i = 0; i < daftarUrl.length; i++) {
    const info = { jalur: i + 1, totalJalur: daftarUrl.length }
    try {
      await unduhSatu(daftarUrl[i], onProgres, info)
      return
    } catch (e) {
      galatTerakhir = e
      onProgres?.(0, 0, { ...info, gantiJalur: true })
    }
  }
  throw galatTerakhir
}

export async function pasangApk() {
  if (!Capacitor.isNativePlatform()) throw new Error('Hanya di perangkat Android')
  await PembukaApk.install({ file: NAMA_FILE_APK })
}

// Hapus sisa berkas pembaruan/cadangan lama agar memori tidak penuh
export async function bersihkanSisa() {
  if (!Capacitor.isNativePlatform()) return 0
  try {
    const r = await PembukaApk.bersihkan()
    return r?.terhapus || 0
  } catch {
    return 0
  }
}

// Notifikasi lokal: ada pembaruan tersedia — kanal prioritas tinggi agar
// tampil sebagai banner heads-up di atas aplikasi, bukan cuma di statusbar.
const ID_KANAL_UPDATE = 'pembaruan-kasir'

async function siapkanKanalUpdate() {
  try {
    await LocalNotifications.createChannel({
      id: ID_KANAL_UPDATE,
      name: t('Pembaruan Aplikasi'),
      description: t('Notifikasi pembaruan aplikasi'),
      importance: 'HIGH',
      visibility: 'PUBLIC',
      vibration: true,
      sound: 'kasir_lonceng.mp3',
    })
  } catch {
    /* kanal mungkin sudah ada */
  }
}

export async function kirimNotif(info) {
  try {
    if (!Capacitor.isNativePlatform()) return
    const izin = await LocalNotifications.checkPermissions()
    let status = izin.display
    if (status !== 'granted') {
      const minta = await LocalNotifications.requestPermissions()
      status = minta.display
    }
    if (status !== 'granted') return
    await siapkanKanalUpdate()
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 4201,
          channelId: ID_KANAL_UPDATE,
          title: `${t('Pembaruan v')}${info.versi} ${t('tersedia')} 🎉`,
          body: t('Buka aplikasi untuk mengunduh versi terbaru.'),
          schedule: { at: new Date(Date.now() + 400) },
        },
      ],
    })
  } catch {
    /* diam — notifikasi bukan hal kritis */
  }
}

// Ambil catatan rilis versi tertentu (untuk popup pasca-pembaruan)
export async function ambilCatatanVersi(versi) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/v${versi}`,
      { headers: { Accept: 'application/vnd.github+json' } },
    )
    if (!res.ok) return ''
    const data = await res.json()
    return data.body || ''
  } catch {
    return ''
  }
}

// Simpan catatan rilis saat cek pembaruan, agar popup changelog
// tetap berisi walau jaringan/API GitHub sedang bermasalah.
const KUNCI_CATATAN = 'kasir_catatan_rilis'

export function simpanCatatan(versi, teks) {
  try {
    if (teks) localStorage.setItem(KUNCI_CATATAN, JSON.stringify({ versi, teks }))
  } catch {
    /* penyimpanan penuh — abaikan */
  }
}

export function bacaCatatanTersimpan(versi) {
  try {
    const d = JSON.parse(localStorage.getItem(KUNCI_CATATAN))
    return d?.versi === String(versi) ? d.teks || '' : null
  } catch {
    return null
  }
}

// Ubah teks catatan rilis menjadi daftar baris bersih
export const barisCatatan = (teks) =>
  String(teks || '')
    .split('\n')
    .map((b) =>
      b
        .trim()
        .replace(/^#{1,6}\s*/, '')
        .replace(/^[-*]+\s*/, '')
        .replace(/\*\*/g, '')
        .replace(/`/g, ''),
    )
    .filter((b) => b && !/^(what.?s changed|full changelog)/i.test(b))
