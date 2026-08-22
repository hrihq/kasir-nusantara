import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { PembukaApk } from './update.js'

const AWALAN = 'kasir'

export async function eksporCadangan() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const kunci = localStorage.key(i)
    if (kunci.startsWith(AWALAN)) data[kunci] = localStorage.getItem(kunci)
  }
  const isi = JSON.stringify({ aplikasi: 'kasir-nusantara', versiCadangan: 1, data })
  const nama = `cadangan-kasir-${new Date().toISOString().slice(0, 10)}.json`
  await Filesystem.writeFile({ path: nama, data: isi, directory: Directory.Cache, encoding: Encoding.UTF8 })
  if (Capacitor.isNativePlatform()) {
    await PembukaApk.bagikan({ file: nama, jenis: 'application/json' })
  } else {
    const url = URL.createObjectURL(new Blob([isi], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = nama
    a.click()
    URL.revokeObjectURL(url)
  }
}

export async function imporCadangan(berkas) {
  const teks = await berkas.text()
  let cadangan
  try {
    cadangan = JSON.parse(teks)
  } catch {
    throw new Error('Berkas bukan cadangan yang sah')
  }
  if (cadangan?.aplikasi !== 'kasir-nusantara' || typeof cadangan.data !== 'object') {
    throw new Error('Berkas bukan cadangan Kasir Nusantara')
  }
  Object.entries(cadangan.data).forEach(([k, v]) => localStorage.setItem(k, v))
}
