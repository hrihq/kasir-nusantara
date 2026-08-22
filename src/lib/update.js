import { Capacitor, registerPlugin } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import pkg from '../../package.json'

export const VERSI = pkg.version

const GITHUB_REPO = 'hrihq/kasir-nusantara'

export const NAMA_FILE_APK = 'KasirNusantara-pembaruan.apk'

export const PembukaApk = registerPlugin('PembukaApk')

const bandingkanVersi = (a, b) => {
  const pa = String(a).split('.').map(Number)
  const pb = String(b).split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0) ? 1 : -1
  }
  return 0
}

export async function cekPembaruan() {
  if (!GITHUB_REPO || GITHUB_REPO.includes('USERNAME')) return null
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const versi = String(data.tag_name || '').replace(/^v/i, '')
    if (!versi || bandingkanVersi(versi, VERSI) <= 0) return null
    const apk = (data.assets || []).find((a) => a.name.toLowerCase().endsWith('.apk'))
    return {
      versi,
      catatan: data.body || '',
      urlUnduh: apk ? apk.browser_download_url : data.html_url,
    }
  } catch {
    return null
  }
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

async function unduhSatu(url, onProgres) {
  if (Capacitor.isNativePlatform()) {
    const langganan = await PembukaApk.addListener('progres', (d) => {
      onProgres?.(d.total ? d.terunduh / d.total : 0, d.terunduh)
    })
    try {
      await PembukaApk.unduh({ url, file: NAMA_FILE_APK })
    } finally {
      langganan.remove()
    }
    return
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error('Unduhan gagal')
  const total = Number(res.headers.get('content-length')) || 0
  const reader = res.body.getReader()
  const bagian = []
  let terunduh = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    bagian.push(value)
    terunduh += value.length
    onProgres?.(total ? terunduh / total : 0, terunduh)
  }
  await Filesystem.writeFile({
    path: NAMA_FILE_APK,
    data: await blobKeBase64(new Blob(bagian, { type: 'application/vnd.android.package-archive' })),
    directory: Directory.Cache,
  })
}

export async function unduhApk(url, onProgres) {
  const daftarUrl = [url, ...CERMIN.map((m) => m + url)]
  let galatTerakhir
  for (const u of daftarUrl) {
    try {
      await unduhSatu(u, onProgres)
      return
    } catch (e) {
      galatTerakhir = e
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
