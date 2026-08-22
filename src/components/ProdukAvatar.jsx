const WARNA = [
  'bg-merek-lembut text-merek',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
]

function indeksWarna(teks) {
  let h = 0
  for (const c of teks) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h) % WARNA.length
}

export default function ProdukAvatar({ produk, className = '' }) {
  if (produk.gambar) {
    return <img src={produk.gambar} alt={produk.nama} className={`${className} object-cover`} loading="lazy" />
  }
  const inisial = (produk.nama || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((k) => k[0])
    .join('')
    .toUpperCase()
  return (
    <span
      className={`${className} flex select-none items-center justify-center font-extrabold ${
        WARNA[indeksWarna(produk.kategori || produk.nama)]
      }`}
      aria-hidden="true"
    >
      {inisial}
    </span>
  )
}
