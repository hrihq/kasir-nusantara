import { BackgroundTask } from '@capgo/capacitor-background-task'
import { Capacitor } from '@capacitor/core'
import { cekPembaruan, sudahDitunda } from './update.js'
import { kirimNotif } from './update.js'

const TASK_ID = 'cek-pembaruan'

// Callback WAJIB didaftarkan di scope modul (bukan dalam useEffect)
// agar native bisa memanggilnya saat app dibangunkan di latar belakang.
BackgroundTask.defineTask(TASK_ID, async () => {
  try {
    const pengaturan = JSON.parse(localStorage.getItem('kasir_pengaturan') || '{}')
    if (!sudahDitunda(pengaturan)) {
      const hasil = await cekPembaruan()
      if (hasil) kirimNotif(hasil)
    }
  } catch {
    /* abaikan error */
  }
})

export async function mulaiBackgroundTask() {
  if (!Capacitor.isNativePlatform()) return
  try {
    await BackgroundTask.registerTaskAsync(TASK_ID, {
      minimumInterval: 15, // menit — batas minimum Android
      requiresNetwork: true,
    })
  } catch {
    /* plugin tidak tersedia / dibatasi OS */
  }
}

export async function hentikanBackgroundTask() {
  if (!Capacitor.isNativePlatform()) return
  try {
    await BackgroundTask.unregisterTaskAsync(TASK_ID)
  } catch {
    /* abaikan */
  }
}
