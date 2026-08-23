import { Capacitor } from '@capacitor/core'

let modulNfc = null
let sudahCoba = false

async function ambilModul() {
  if (sudahCoba) return modulNfc
  sudahCoba = true
  try {
    modulNfc = await import('@capgo/capacitor-nfc').then((m) => m.CapacitorNfc)
  } catch {
    modulNfc = null
  }
  return modulNfc
}

export const dukungNfc = () => Capacitor.isNativePlatform()

const bytesKeHex = (bytes) =>
  (bytes || [])
    .map((b) => Number(b).toString(16).padStart(2, '0').toUpperCase())
    .join('')

// Mulai scan NFC sungguhan. onTag(uidHex) dipanggil saat kartu ditempel.
// Mengembalikan fungsi berhenti. Melempar error bila NFC tidak tersedia/izin ditolak/mati.
export async function mulaiScanNfcAsli(onTag, onGalat) {
  const Nfc = await ambilModul()
  if (!Capacitor.isNativePlatform() || !Nfc) throw new Error('NFC_TIDAK_TERSEDIA')

  const izin = await Nfc.checkPermissions()
  if (izin.nfc !== 'granted') {
    const minta = await Nfc.requestPermissions()
    if (minta.nfc !== 'granted') throw new Error('NFC_IZIN_DITOLAK')
  }
  const status = await Nfc.isEnabled().catch(() => ({ enabled: true }))
  if (status && status.enabled === false) throw new Error('NFC_MATI')

  const pegangan = await Nfc.addListener('nfcEvent', (event) => {
    const id = event?.tag?.id
    if (!id || !id.length) return
    onTag(bytesKeHex(id))
  })
  const peganganGagal = await Nfc.addListener('nfcError', (e) =>
    onGalat?.(e?.message || 'NFC error'),
  ).catch(() => null)

  await Nfc.startScanning({ invalidateAfterFirstRead: false })

  return async () => {
    try { await pegangan.remove() } catch { /* abaikan */ }
    try { await peganganGagal?.remove() } catch { /* abaikan */ }
    try { await Nfc.stopScanning() } catch { /* abaikan */ }
  }
}
