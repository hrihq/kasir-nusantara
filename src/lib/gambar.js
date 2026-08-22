export function bacaGambarKecil(file, maks = 256, tipe = 'image/jpeg', kualitas = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Berkas bukan gambar'))
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const kanvas = document.createElement('canvas')
      const skala = Math.min(1, maks / Math.max(img.width, img.height))
      kanvas.width = Math.max(1, Math.round(img.width * skala))
      kanvas.height = Math.max(1, Math.round(img.height * skala))
      kanvas.getContext('2d').drawImage(img, 0, 0, kanvas.width, kanvas.height)
      URL.revokeObjectURL(url)
      resolve(kanvas.toDataURL(tipe, kualitas))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal membaca gambar'))
    }
    img.src = url
  })
}
