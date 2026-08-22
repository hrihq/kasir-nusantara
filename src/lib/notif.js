import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { t } from './bahasa.js'

const ID_KANAL = 'pengingat-kasir-v2'
const ID_NOTIF = 1001
const SUARA_KANAL = 'kasir_lonceng.mp3'

export async function siapkanKanal() {
  if (!Capacitor.isNativePlatform()) return
  try {
    await LocalNotifications.createChannel({
      id: ID_KANAL,
      name: 'Pengingat Kasir',
      description: 'Pengingat harian mencatat penjualan',
      importance: 'HIGH',
      visibility: 'PUBLIC',
      sound: SUARA_KANAL,
      vibration: true,
    })
  } catch {
    /* kanal mungkin sudah ada */
  }
}

export async function izinNotifikasi() {
  if (!Capacitor.isNativePlatform()) return 'granted'
  const kini = await LocalNotifications.checkPermissions()
  if (kini.display === 'granted') return 'granted'
  const minta = await LocalNotifications.requestPermissions()
  return minta.display
}

export async function jadwalkanPengingat(aktif, jam) {
  if (!Capacitor.isNativePlatform()) return true
  try {
    const terjadwal = await LocalNotifications.getPending()
    for (const n of terjadwal.notifications) {
      if (n.id === ID_NOTIF || n.extra?.pengingat) {
        await LocalNotifications.cancel({ notifications: [{ id: n.id }] })
      }
    }
    if (!aktif) return true
    const [j, m] = (jam || '18:00').split(':').map(Number)
    await siapkanKanal()
    await LocalNotifications.schedule({
      notifications: [
        {
          id: ID_NOTIF,
          channelId: ID_KANAL,
          title: t('Waktunya catat penjualan'),
          body: t('Rekap transaksi dan pengeluaran hari ini di Kasir Nusantara.'),
          schedule: { on: { hour: j, minute: m }, allowWhileIdle: true },
          extra: { pengingat: true },
        },
      ],
    })
    return true
  } catch {
    return false
  }
}
