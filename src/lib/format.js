import { lokale } from './bahasa.js'

export const rupiah = (n) =>
  new Intl.NumberFormat(lokale(), {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0)

const pad = (n) => String(n).padStart(2, '0')

export const kunciHari = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const tanggalPendek = (iso) =>
  new Intl.DateTimeFormat(lokale(), { day: 'numeric', month: 'short' }).format(new Date(iso))

export const tanggalLengkap = (iso) =>
  new Intl.DateTimeFormat(lokale(), { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  )

let hitung = 0
export const buatId = () =>
  `${Date.now().toString(36)}${(hitung++).toString(36)}${Math.random().toString(36).slice(2, 6)}`
