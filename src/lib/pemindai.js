// Pemindai barcode built-in: pakai BarcodeDetector API (Chrome/Android WebView)
// + getUserMedia untuk akses kamera. Tanpa dependency ML Kit / native plugin.

export const dukungPemindai = () =>
  typeof BarcodeDetector !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

const FORMAT = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'code_39',
  'qr_code',
]

// Minta izin kamera & mulai stream ke elemen video.
export async function mulaiKamera(videoEl) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
  })
  videoEl.srcObject = stream
  await videoEl.play()
  return stream
}

// Deteksi barcode dari video secara terus-menerus.
// Mengembalikan { value, format } saat pertama kali terdeteksi, lalu stop.
export function mulaiDeteksi(videoEl, onHasil) {
  const detektor = new BarcodeDetector({ formats: FORMAT })
  let berjalan = true

  const loop = async () => {
    if (!berjalan) return
    try {
      const barcodes = await detektor.detect(videoEl)
      if (barcodes.length > 0 && berjalan) {
        berjalan = false
        const b = barcodes[0]
        onHasil({ value: b.rawValue || b.displayValue || '', format: b.format })
        return
      }
    } catch {
      // deteksi gagal pada frame ini — coba lagi
    }
    if (berjalan) requestAnimationFrame(loop)
  }
  loop()

  return () => { berjalan = false }
}

// Stop semua track dari stream
export function hentikanKamera(stream) {
  stream?.getTracks().forEach((t) => t.stop())
}
