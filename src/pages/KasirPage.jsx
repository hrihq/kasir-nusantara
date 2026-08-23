import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { rupiah } from '../lib/format.js'
import { bunyiSukses } from '../lib/suara.js'
import { t } from '../lib/bahasa.js'
import { pakaiTema } from '../lib/tema.js'
import Ikon from '../components/Ikon.jsx'
import ProdukAvatar from '../components/ProdukAvatar.jsx'
import { Modal } from '../components/Modal.jsx'
import { StrukModal } from '../components/StrukModal.jsx'
import PesanPudar from '../components/PesanPudar.jsx'
import KameraSheet from '../components/KameraSheet.jsx'
import KoneksiIndicator from '../components/KoneksiIndicator.jsx'
import { dukungPemindai } from '../lib/pemindai.js'

function BarisRingkas({ label, nilai }) {
  return (
    <div className="flex justify-between">
      <span className="text-black/55">{label}</span>
      <span className="font-semibold">{nilai}</span>
    </div>
  )
}

function InputQty({ nilai, ubah }) {
  const [teks, setTeks] = useState(String(nilai))
  const [fokus, setFokus] = useState(false)

  useEffect(() => {
    if (!fokus) setTeks(String(nilai))
  }, [nilai, fokus])

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={teks}
      onFocus={(e) => {
        setFokus(true)
        e.target.select()
      }}
      onChange={(e) => {
        const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
        setTeks(v)
        if (v !== '') ubah(Number(v))
      }}
      onBlur={() => {
        setFokus(false)
        const aman = Math.max(1, parseInt(teks, 10) || 1)
        setTeks(String(aman))
        ubah(aman)
      }}
      className="w-12 rounded-lg border border-black/10 bg-white py-1 text-center text-sm font-bold outline-none focus:border-merek"
      aria-label={t('Jumlah')}
    />
  )
}

function ModalBayar({ open, onClose, subtotal, ppnPersen, ppnNominal, total, garis, onSuccess }) {
  const { simpanTransaksi, pengaturan, members, diskonList, shiftAktif } = useStore()
  const [metode, setMetode] = useState('Tunai')
  const [bayar, setBayar] = useState('')
  const [memberId, setMemberId] = useState('')
  const [diskonId, setDiskonId] = useState('')

  // Hitung diskon
  const diskonTerpilih = diskonList.find((d) => d.id === diskonId && d.aktif)
  const memberTerpilih = members.find((m) => m.id === memberId)

  let diskonNominal = 0
  if (diskonTerpilih) {
    const berlaku = diskonTerpilih.berlakuUntuk === 'semua' ||
      garis.some((g) =>
        diskonTerpilih.berlakuUntuk === 'kategori'
          ? g.kategori === diskonTerpilih.targetId
          : g.id === diskonTerpilih.targetId,
      )
    const melewatiMin = !diskonTerpilih.minPembelian || subtotal >= diskonTerpilih.minPembelian
    if (berlaku && melewatiMin) {
      diskonNominal = diskonTerpilih.tipe === 'persen'
        ? Math.round((subtotal * diskonTerpilih.nilai) / 100)
        : diskonTerpilih.nilai
    }
  }
  // Diskon member (tambahan)
  if (memberTerpilih?.diskonPersen > 0 && !diskonTerpilih) {
    diskonNominal = Math.round((subtotal * memberTerpilih.diskonPersen) / 100)
  }

  const subtotalSetelahDiskon = Math.max(0, subtotal - diskonNominal)
  const ppnAkhir = Math.round((subtotalSetelahDiskon * ppnPersen) / 100)
  const totalAkhirAsli = subtotalSetelahDiskon + ppnAkhir
  const totalAkhir = metode === 'Tunai' ? Math.ceil(totalAkhirAsli / 500) * 500 : totalAkhirAsli
  const nominal = Number(bayar) || 0
  const kembalian = metode === 'Tunai' ? nominal - totalAkhir : 0
  const cukup = metode !== 'Tunai' || nominal >= totalAkhir
  const tampilBayar = bayar === '' ? '' : new Intl.NumberFormat('id-ID').format(Number(bayar))

  if (!shiftAktif) {
    return (
      <Modal open={open} onClose={onClose} judul={t('Pembayaran')}>
        <div className="py-8 text-center">
          <Ikon nama="kunci" className="mx-auto h-10 w-10 text-black/25" />
          <p className="mt-3 text-sm font-semibold text-black/55">{t('Buka shift dulu sebelum berjualan.')}</p>
          <button onClick={onClose} className="tombol--utama mt-4">{t('Tutup')}</button>
        </div>
      </Modal>
    )
  }

  const selesai = () => {
    const trx = simpanTransaksi({
      item: garis.map((g) => ({ id: g.id, nama: g.nama, harga: g.harga, qty: g.qty, kategori: g.kategori })),
      subtotal,
      ppnPersen,
      ppnNominal: ppnAkhir,
      total: totalAkhir,
      metode,
      bayar: metode === 'Tunai' ? nominal : totalAkhir,
      kembalian: metode === 'Tunai' ? kembalian : 0,
      memberId: memberId || null,
      diskonId: diskonId || null,
      diskonNominal,
    })
    setMetode('Tunai')
    setBayar('')
    setMemberId('')
    setDiskonId('')
    bunyiSukses()
    onSuccess(trx)
  }

  return (
    <Modal open={open} onClose={onClose} judul={t('Pembayaran')}>
      <div className="space-y-1.5 rounded-2xl bg-white p-4 text-sm shadow-kartu">
        <BarisRingkas label={t('Subtotal')} nilai={rupiah(subtotal)} />
        {diskonNominal > 0 && (
          <BarisRingkas label={t('Diskon')} nilai={`-${rupiah(diskonNominal)}`} />
        )}
        {ppnPersen > 0 && <BarisRingkas label={`${t('PPN')} ${ppnPersen}%`} nilai={rupiah(ppnAkhir)} />}
        <div className="flex justify-between pt-1 text-base font-bold">
          <span>{t('Total Tagihan')}</span>
          <span className="text-merek">{rupiah(totalAkhir)}</span>
        </div>
        {metode === 'Tunai' && totalAkhir !== totalAkhirAsli && (
          <p className="mt-1 text-right text-xs font-semibold text-merek">
            {t('Tunai dibulatkan jadi %s').replace('%s', rupiah(totalAkhir))}
          </p>
        )}
      </div>

      {/* Pilih Member */}
      <div className="mt-3">
        <span className="label">{t('Member (opsional)')}</span>
        <select className="input" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          <option value="">{t('Tanpa member')}</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama}{m.diskonPersen > 0 ? ` (${m.diskonPersen}% off)` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Pilih Diskon */}
      <div className="mt-2">
        <span className="label">{t('Diskon Tambahan')}</span>
        <select className="input" value={diskonId} onChange={(e) => setDiskonId(e.target.value)}>
          <option value="">{t('Tanpa diskon')}</option>
          {diskonList.filter((d) => d.aktif).map((d) => (
            <option key={d.id} value={d.id}>
              {d.nama} — {d.tipe === 'persen' ? `${d.nilai}%` : rupiah(d.nilai)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <span className="label">{t('Metode Pembayaran')}</span>
        <div className="grid grid-cols-2 gap-2">
          {['Tunai', 'QRIS'].map((m) => (
            <button
              key={m}
              onClick={() => setMetode(m)}
              className={`chip justify-center ${
                metode === m
                  ? 'bg-merek text-white'
                  : 'bg-white text-black/60 ring-1 ring-black/10'
              }`}
            >
              {t(m)}
            </button>
          ))}
        </div>
      </div>

      {metode === 'Tunai' && (
        <div className="mt-4">
          <span className="label">{t('Uang Diterima')}</span>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold"
              style={{ color: 'var(--teks)', opacity: 0.4 }}
            >
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={tampilBayar}
              onChange={(e) => setBayar(e.target.value.replace(/\D/g, '').slice(0, 9))}
              placeholder="0"
              className="input pl-9 text-lg font-bold"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {[totalAkhir, 20000, 50000, 100000].map((v, i) => (
              <button
                key={i}
                onClick={() => setBayar(String(v))}
                className="chip bg-white text-black/60 ring-1 ring-black/10"
              >
                {i === 0 ? t('Uang Pas') : rupiah(v)}
              </button>
            ))}
          </div>
          <div
            className={`mt-3 flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
              !bayar ? 'bg-white' : kembalian >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}
          >
            <span>{t('Kembalian')}</span>
            <span>
              {!bayar ? '—' : kembalian >= 0 ? rupiah(kembalian) : `${t('Kurang')} ${rupiah(-kembalian)}`}
            </span>
          </div>
        </div>
      )}

      {metode === 'QRIS' && (
        <div className="mt-4">
          {pengaturan.qrisGambar ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-kartu">
              <img src={pengaturan.qrisGambar} alt="Kode QRIS" className="max-h-60 rounded-xl" />
              <p className="text-[11px] text-black/40">{t('QRIS diatur lewat menu Pengaturan.')}</p>
            </div>
          ) : (
            <label
              onClick={() => window.dispatchEvent(new CustomEvent('kasir:buka-tab', { detail: 'atur' }))}
              className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border border-dashed border-black/25 py-7 text-center"
            >
              <Ikon nama="foto" className="h-8 w-8 text-merek" />
              <span className="text-sm font-bold">{t('Belum ada QRIS')}</span>
              <span className="text-xs text-black/45">{t('Atur QRIS lewat menu Pengaturan.')}</span>
            </label>
          )}
        </div>
      )}

      <button disabled={!cukup} onClick={selesai} className="tombol--utama mt-5 w-full">
        {t('Selesaikan Transaksi')}
      </button>
    </Modal>
  )
}

export default function KasirPage() {
  const { produk, pengaturan, keranjang, setKeranjang, simpanTransaksi } = useStore()
  const [gelap, gantiTema] = pakaiTema()
  const [q, setQ] = useState('')
  const [kat, setKat] = useState('Semua')
  const [sheetBuka, setSheetBuka] = useState(false)
  const [bayarBuka, setBayarBuka] = useState(false)
  const [trxTerakhir, setTrxTerakhir] = useState(null)
  const [pesanPindai, setPesanPindai] = useState(null)
  const [kameraBuka, setKameraBuka] = useState(false)

  const onHasilPindai = (hasil) => {
    setKameraBuka(false)
    const kode = (hasil?.value || '').trim()
    if (!kode) return
    const p = produk.find((x) => x.kode && x.kode === kode)
    if (p) {
      tambah(p.id)
      navigator.vibrate?.(30)
      setQ('')
      setKat('Semua')
    } else {
      setQ(kode)
      setPesanPindai({
        ok: false,
        teks: `${t('Tidak ada menu dengan barcode:')} ${kode}`,
      })
    }
  }

  const kategori = useMemo(() => ['Semua', ...new Set(produk.map((p) => p.kategori))], [produk])
  const kolomMenu = Number(pengaturan.kolomMenu) || 2
  const rapat = kolomMenu >= 3 // kolom ≥3 → kartu memadat agar muat di layar sempit

  const hasil = useMemo(() => {
    const kunci = q.trim().toLowerCase()
    return produk.filter(
      (p) =>
        (kat === 'Semua' || p.kategori === kat) &&
        (!kunci || p.nama.toLowerCase().includes(kunci)),
    )
  }, [produk, q, kat])

  const garis = useMemo(
    () =>
      keranjang
        .map((k) => {
          const p = produk.find((x) => x.id === k.id)
          return p ? { ...p, qty: k.qty } : null
        })
        .filter(Boolean),
    [keranjang, produk],
  )

  const subtotal = garis.reduce((t, g) => t + g.harga * g.qty, 0)
  const ppnPersen = pengaturan.ppnAktif ? Number(pengaturan.ppnPersen) || 0 : 0
  const ppnNominal = Math.round((subtotal * ppnPersen) / 100)
  const total = subtotal + ppnNominal
  const jmlItem = garis.reduce((t, g) => t + g.qty, 0)

  const tambah = (id) =>
    setKeranjang((k) => {
      const ada = k.find((x) => x.id === id)
      return ada
        ? k.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x))
        : [...k, { id, qty: 1 }]
    })

  const ubahQty = (id, d) =>
    setKeranjang((k) =>
      k.map((x) => (x.id === id ? { ...x, qty: x.qty + d } : x)).filter((x) => x.qty > 0),
    )

  const setQtyLangsung = (id, nilai) =>
    setKeranjang((k) =>
      k.map((x) => {
        if (x.id !== id) return x
        const n = Math.floor(Number(nilai))
        return Number.isFinite(n) && n >= 0 ? { ...x, qty: n } : x
      }),
    )

  return (
    <div className="pb-44">
      {/* Kepala merah */}
      <header className="relative overflow-hidden rounded-b-[28px] bg-gradient-to-br from-merek via-merek to-merek-gelap px-5 pb-6 pt-[max(1.75rem,env(safe-area-inset-top))] text-krem">
        <span aria-hidden="true" className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-white/10" />
        <span aria-hidden="true" className="pointer-events-none absolute -left-10 top-24 h-24 w-24 rounded-full bg-white/[.07]" />
        <div className="relative z-[1]">
          <div className="flex items-center gap-3">
            <img
              src={pengaturan.logo || '/icon.svg'}
              alt=""
              className="h-11 w-11 rounded-xl bg-white object-contain p-1 shadow-md"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-judul text-xl leading-tight">{pengaturan.namaToko}</div>
              <div className="text-xs text-white/70">{t('Kasir siap melayani')}</div>
            </div>
            <button
              onClick={() => {
                navigator.vibrate?.(8)
                gantiTema()
              }}
              aria-label={gelap ? t('Mode terang') : t('Mode gelap')}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-krem transition duration-150 active:scale-90 active:bg-white/30"
            >
              <span key={gelap ? 'g' : 't'} className="anim-muncul block">
                <Ikon nama={gelap ? 'matahari' : 'bulan'} className="h-5 w-5" />
              </span>
            </button>
          </div>
          <div className="relative mt-4">
            <KoneksiIndicator />
          </div>
          <div className="relative mt-2">
            <Ikon
              nama="cari"
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-black/35"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('Cari menu…')}
              className="input pl-10 pr-12 text-tinta"
            />
            {dukungPemindai() && (
              <button
                onClick={() => setKameraBuka(true)}
                aria-label={t('Pindai Barcode')}
                className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl bg-merek text-white transition active:scale-90"
              >
                <Ikon nama="pindai" className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
          {pesanPindai && (
            <div className="mt-2">
              <PesanPudar pesan={pesanPindai} onSelesai={() => setPesanPindai(null)} />
            </div>
          )}
        </div>
      </header>

      {/* Chip kategori */}
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
        {kategori.map((k) => (
          <button
            key={k}
            onClick={() => setKat(k)}
            className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition active:scale-95 ${
              kat === k ? 'bg-merek text-white' : 'bg-white text-black/60 ring-1 ring-black/10'
            }`}
          >
            {k === 'Semua' ? t('Semua') : k}
          </button>
        ))}
      </div>

      {/* Grid menu — jumlah kolom mengikuti pengaturan pengguna (portrait) */}
      <div
        className={`grid grid-cols-[repeat(var(--kolom),minmax(0,1fr))] px-5 pt-3 layar:grid-cols-6 layar:gap-2 layar:px-4 layar:pt-2 ${
          rapat ? 'gap-2' : 'gap-3'
        }`}
        style={{ '--kolom': kolomMenu }}
      >
        {hasil.map((p) => (
          <button
            key={p.id}
            onClick={() => tambah(p.id)}
            className="group relative overflow-hidden rounded-2xl bg-white text-left shadow-kartu transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[.97]"
          >
            <ProdukAvatar produk={p} className={`block aspect-square w-full ${rapat ? 'text-xl' : 'text-3xl'}`} />
              {p.stok >= 0 && (
                <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold shadow ${
                  p.stok === 0 ? 'bg-red-500 text-white' : p.stok <= (p.stokMinimum || 0) ? 'bg-amber-400 text-white' : 'bg-emerald-500 text-white'
                }`}>
                  {p.stok === 0 ? t('Habis') : p.stok}
                </span>
              )}
            <div className={`border-t border-black/5 ${rapat ? 'p-1.5' : 'p-3'} layar:p-2`}>
              <div
                className={
                  rapat
                    ? 'line-clamp-1 text-[11px] font-semibold leading-tight'
                    : 'line-clamp-2 min-h-[2.5em] text-sm font-semibold leading-snug layar:min-h-0 layar:text-[11px] layar:leading-tight'
                }
              >
                {p.nama}
              </div>
              <div className="mt-1 flex min-w-0 items-center justify-between gap-1">
                <span
                  className={`min-w-0 truncate font-bold text-merek ${rapat ? 'text-[11px]' : 'text-sm layar:text-xs'}`}
                >
                  {rupiah(p.harga)}
                </span>
                <span
                  className={`grid shrink-0 place-items-center rounded-full bg-merek-lembut text-merek transition duration-200 group-hover:bg-merek group-hover:text-white ${
                    rapat ? 'h-5 w-5' : 'h-7 w-7 layar:h-5 layar:w-5'
                  }`}
                >
                  <Ikon nama="plus" className={rapat ? 'h-3 w-3' : 'h-3.5 w-3.5 layar:h-3 layar:w-3'} />
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
      {produk.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-5 py-20 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-merek-lembut text-merek">
            <Ikon nama="kotak" className="h-7 w-7" />
          </span>
          <p className="text-base font-bold">{t('Menu masih kosong')}</p>
          <p className="max-w-[250px] text-xs leading-relaxed text-black/45">
            {t('Tambahkan menu pertamamu untuk mulai berjualan.')}
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('kasir:buka-tab', { detail: 'menu' }))}
            className="tombol--utama mt-1 !px-4 !py-2.5 text-sm"
          >
            {t('Tambah Menu Pertama')}
          </button>
        </div>
      ) : (
        hasil.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-black/35">
            <Ikon nama="cari" className="h-8 w-8" />
            <p className="text-sm">{t('Menu tidak ditemukan.')}</p>
          </div>
        )
      )}

      {/* Batang keranjang mengapung */}
      {jmlItem > 0 && !sheetBuka && !bayarBuka && (
        <div
          className={`fixed left-1/2 z-30 w-full max-w-[398px] -translate-x-1/2 px-4 layar:left-[calc((100%-104px)/2)] ${
            pengaturan.modeLite
              ? 'bottom-[84px] layar:bottom-[74px]'
              : 'bottom-[96px] layar:bottom-6'
          }`}
        >
          <button
            onClick={() => setSheetBuka(true)}
            className="tombol--utama anim-muncul w-full justify-between rounded-2xl py-3.5 shadow-lg"
          >
            <span className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/25 text-xs font-bold">
                {jmlItem}
              </span>
              {t('Keranjang')}
            </span>
            <span>{rupiah(total)}</span>
          </button>
        </div>
      )}

      {/* Lembar keranjang */}
      <Modal open={sheetBuka} onClose={() => setSheetBuka(false)} judul={t('Keranjang')}>
        {garis.length === 0 ? (
          <p className="py-6 text-center text-sm text-black/40">{t('Belum ada item.')}</p>
        ) : (
          <>
            <ul className="space-y-2.5">
              {garis.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-kartu"
                >
                  <ProdukAvatar produk={g} className="h-11 w-11 shrink-0 rounded-xl text-sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{g.nama}</div>
                    <div className="text-xs text-black/45">{rupiah(g.harga)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => ubahQty(g.id, -1)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-krem-tua active:scale-90"
                      aria-label={t('Kurangi')}
                    >
                      <Ikon nama="minus" className="h-4 w-4" />
                    </button>
                    <InputQty nilai={g.qty} ubah={(n) => setQtyLangsung(g.id, n)} />
                    <button
                      onClick={() => ubahQty(g.id, 1)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-merek text-white active:scale-90"
                      aria-label={t('Tambah')}
                    >
                      <Ikon nama="plus" className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="w-20 text-right text-sm font-bold">
                    {rupiah(g.harga * g.qty)}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 rounded-2xl bg-white p-4 text-sm shadow-kartu">
              <BarisRingkas label={t('Subtotal')} nilai={rupiah(subtotal)} />
              {ppnPersen > 0 && <BarisRingkas label={`${t('PPN')} ${ppnPersen}%`} nilai={rupiah(ppnNominal)} />}
              <div className="flex justify-between border-t border-dashed border-black/15 pt-2 text-base font-bold">
                <span>{t('Total')}</span>
                <span className="text-merek">{rupiah(total)}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setSheetBuka(false)
                setBayarBuka(true)
              }}
              className="tombol--utama mt-4 w-full"
            >
              {t('Bayar Sekarang')}
            </button>
          </>
        )}
      </Modal>

      {/* Modal pembayaran */}
      <ModalBayar
        open={bayarBuka}
        onClose={() => setBayarBuka(false)}
        subtotal={subtotal}
        ppnPersen={ppnPersen}
        ppnNominal={ppnNominal}
        total={total}
        garis={garis}
        onSuccess={(trx) => {
          setBayarBuka(false)
          setKeranjang([])
          setTrxTerakhir(trx)
        }}
      />

      <StrukModal trx={trxTerakhir} pengaturan={pengaturan} onClose={() => setTrxTerakhir(null)} />
      <KameraSheet buka={kameraBuka} tutup={() => setKameraBuka(false)} onHasil={onHasilPindai} />
    </div>
  )
}
