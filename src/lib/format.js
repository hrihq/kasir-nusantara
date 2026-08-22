const fmtRp = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export const rupiah = (n) => fmtRp.format(Number(n) || 0)

const pad = (n) => String(n).padStart(2, '0')

export const kunciHari = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const tanggalPendek = (iso) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(iso))

export const tanggalLengkap = (iso) =>
  new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  )

let hitung = 0
export const buatId = () =>
  `${Date.now().toString(36)}${(hitung++).toString(36)}${Math.random().toString(36).slice(2, 6)}`
