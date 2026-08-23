import { Capacitor } from '@capacitor/core'
import { BarcodeFormat, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning'

// Pemindai barcode lewat kamera (ML Kit). Format yang relevan untuk
// barang dagangan: EAN-13/8, UPC, Code128/39, QR.
const FORMAT = [
  BarcodeFormat.Ean13,
  BarcodeFormat.Ean8,
  BarcodeFormat.UpcA,
  BarcodeFormat.UpcE,
  BarcodeFormat.Code128,
  BarcodeFormat.Code39,
  BarcodeFormat.QrCode,
]

export const dukungPemindai = () => Capacitor.isNativePlatform()

export async function pindaiBarcode() {
  if (!dukungPemindai()) throw new Error('Pemindai hanya tersedia di aplikasi Android')

  const status = await BarcodeScanner.checkPermissions()
  if (status.camera !== 'granted') {
    const minta = await BarcodeScanner.requestPermissions()
    if (minta.camera !== 'granted') throw new Error('Izin kamera ditolak')
  }

  const { barcodes } = await BarcodeScanner.scan({ formats: FORMAT })
  return barcodes.find((b) => b.rawValue || b.displayValue) ?? null
}
