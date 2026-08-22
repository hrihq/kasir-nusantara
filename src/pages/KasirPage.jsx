import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { rupiah } from '../lib/format.js'
import { bacaGambarKecil } from '../lib/gambar.js'
import { bunyiSukses } from '../lib/suara.js'
import PesanPudar from '../components/PesanPudar.jsx'
import { pakaiTema } from '../lib/tema.js'
import Ikon from '../components/Ikon.jsx'
import ProdukAvatar from '../components/ProdukAvatar.jsx'
import { Modal } from '../components/Modal.jsx'
import { StrukModal } from '../components/StrukModal.jsx'

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
      aria-label="Jumlah"
    />
  )
}

function ModalBayar({ open, onClose, subtotal, ppnPersen, ppnNominal, total, garis, onSuccess }) {
  const { simpanTransaksi, pengaturan, setPengaturan } = useStore()
  const [metode, setMetode] = useState('Tunai')
  const [bayar, setBayar] = useState('')
  const [pesanQris, setPesanQris] = useState(null)

  const totalAkhir = metode === 'Tunai' ? Math.ceil(total / 500) * 500 : total
  const nominal = Number(bayar) || 0
  const kembalian = metode === 'Tunai' ? nominal - totalAkhir : 0
  const cukup = metode !== 'Tunai' || nominal >= totalAkhir
  const tampilBayar = bayar === '' ? '' : new Intl.NumberFormat('id-ID').format(Number(bayar))

  const unggahQris = async (e) => {
    const berkas = e.target.files?.[0]
    if (!berkas) return
    try {
      const dataUrl = await bacaGambarKecil(berkas, 640)
      setPengaturan((s) => ({ ...s, qrisGambar: dataUrl }))
      setPesanQris({ ok: true, teks: 'QRIS tersimpan.' })
    } catch {
      setPesanQris({ ok: false, teks: 'Gagal membaca gambar.' })
    }
  }

  const selesai = () => {
    const trx = simpanTransaksi({
      item: garis.map((g) => ({ id: g.id, nama: g.nama, harga: g.harga, qty: g.qty })),
      subtotal,
      ppnPersen,
      ppnNominal,
      total: totalAkhir,
      metode,
      bayar: metode === 'Tunai' ? nominal : totalAkhir,
      kembalian: metode === 'Tunai' ? kembalian : 0,
    })
    setMetode('Tunai')
    setBayar('')
    bunyiSukses()
    onSuccess(trx)
  }

  return (
    <Modal open={open} onClose={onClose} judul="Pembayaran">
      <div className="space-y-1.5 rounded-2xl bg-white p-4 text-sm shadow-kartu">
        <BarisRingkas label="Subtotal" nilai={rupiah(subtotal)} />
        {ppnPersen > 0 && <BarisRingkas label={`PPN ${ppnPersen}%`} nilai={rupiah(ppnNominal)} />}
        <div className="flex justify-between pt-1 text-base font-bold">
          <span>Total Tagihan</span>
          <span className="text-merek">{rupiah(total)}</span>
        </div>
        {metode === 'Tunai' && totalAkhir !== total && (
          <p className="mt-1 text-right text-xs font-semibold text-merek">
            Tunai dibulatkan jadi {rupiah(totalAkhir)}
          </p>
        )}
      </div>

      <div className="mt-4">
        <span className="label">Metode Pembayaran</span>
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
              {m}
            </button>
          ))}
        </div>
      </div>

      {metode === 'Tunai' && (
        <div className="mt-4">
          <span className="label">Uang Diterima</span>
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
                {i === 0 ? 'Uang Pas' : rupiah(v)}
              </button>
            ))}
          </div>
          <div
            className={`mt-3 flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
              !bayar ? 'bg-white' : kembalian >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}
          >
            <span>Kembalian</span>
            <span>
              {!bayar ? '—' : kembalian >= 0 ? rupiah(kembalian) : `Kurang ${rupiah(-kembalian)}`}
            </span>
          </div>
        </div>
      )}

      {metode === 'QRIS' && (
        <div className="mt-4">
          {pengaturan.qrisGambar ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-kartu">
              <img src={pengaturan.qrisGambar} alt="Kode QRIS" className="max-h-60 rounded-xl" />
              <label className="chip cursor-pointer gap-1.5 bg-krem-tua text-xs">
                Ganti QRIS
                <input type="file" accept="image/*" className="hidden" onChange={unggahQris} />
              </label>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border border-dashed border-black/25 py-7 text-center">
              <Ikon nama="foto" className="h-8 w-8 text-merek" />
              <span className="text-sm font-bold">Tambahkan QRIS</span>
              <span className="text-xs text-black/45">Ambil foto atau pilih gambar kode QRIS-mu</span>
              <input type="file" accept="image/*" className="hidden" onChange={unggahQris} />
            </label>
          )}
          <PesanPudar pesan={pesanQris} onSelesai={() => setPesanQris(null)} />
        </div>
      )}

      <button disabled={!cukup} onClick={selesai} className="tombol--utama mt-5 w-full">
        Selesaikan Transaksi
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

  const kategori = useMemo(() => ['Semua', ...new Set(produk.map((p) => p.kategori))], [produk])

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
              <div className="text-xs text-white/70">Kasir siap melayani</div>
            </div>
            <button
              onClick={gantiTema}
              aria-label={gelap ? 'Mode terang' : 'Mode gelap'}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-krem transition duration-200 active:scale-90"
            >
              <Ikon nama={gelap ? 'matahari' : 'bulan'} className="h-5 w-5" />
            </button>
          </div>
          <div className="relative mt-4">
            <Ikon
              nama="cari"
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-black/35"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari menu…"
              className="input pl-10 text-tinta"
            />
          </div>
        </div>
      </header>

      {/* Chip kategori */}
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
        {kategori.map((k) => (
          <button
            key={k}
            onClick={() => setKat(k)}
            className={`chip ${kat === k ? 'bg-merek text-white' : 'bg-white text-black/60 ring-1 ring-black/10'}`}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Grid menu */}
      <div className="grid grid-cols-2 gap-3 px-5 pt-3 layar:grid-cols-4">
        {hasil.map((p) => (
          <button
            key={p.id}
            onClick={() => tambah(p.id)}
            className="group overflow-hidden rounded-2xl bg-white text-left shadow-kartu transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[.97]"
          >
            <ProdukAvatar produk={p} className="block aspect-square w-full text-3xl" />
            <div className="border-t border-black/5 p-3">
              <div className="line-clamp-2 min-h-[2.5em] text-sm font-semibold leading-snug">{p.nama}</div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-sm font-bold text-merek">{rupiah(p.harga)}</span>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-merek-lembut text-merek transition duration-200 group-hover:bg-merek group-hover:text-white">
                  <Ikon nama="plus" className="h-3.5 w-3.5" />
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
          <p className="text-base font-bold">Menu masih kosong</p>
          <p className="max-w-[250px] text-xs leading-relaxed text-black/45">
            Tambahkan menu pertamamu untuk mulai berjualan.
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('kasir:buka-tab', { detail: 'menu' }))}
            className="tombol--utama mt-1 !px-4 !py-2.5 text-sm"
          >
            Tambah Menu Pertama
          </button>
        </div>
      ) : (
        hasil.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-black/35">
            <Ikon nama="cari" className="h-8 w-8" />
            <p className="text-sm">Menu tidak ditemukan.</p>
          </div>
        )
      )}

      {/* Batang keranjang mengapung */}
      {jmlItem > 0 && !sheetBuka && !bayarBuka && (
        <div className="fixed bottom-[96px] left-1/2 z-30 w-full max-w-[398px] -translate-x-1/2 px-4 layar:bottom-6 layar:left-[calc((100%-104px)/2)]">
          <button
            onClick={() => setSheetBuka(true)}
            className="tombol--utama anim-muncul w-full justify-between rounded-2xl py-3.5 shadow-lg"
          >
            <span className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/25 text-xs font-bold">
                {jmlItem}
              </span>
              Keranjang
            </span>
            <span>{rupiah(total)}</span>
          </button>
        </div>
      )}

      {/* Lembar keranjang */}
      <Modal open={sheetBuka} onClose={() => setSheetBuka(false)} judul="Keranjang">
        {garis.length === 0 ? (
          <p className="py-6 text-center text-sm text-black/40">Belum ada item.</p>
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
                      aria-label="Kurangi"
                    >
                      <Ikon nama="minus" className="h-4 w-4" />
                    </button>
                    <InputQty nilai={g.qty} ubah={(n) => setQtyLangsung(g.id, n)} />
                    <button
                      onClick={() => ubahQty(g.id, 1)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-merek text-white active:scale-90"
                      aria-label="Tambah"
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
              <BarisRingkas label="Subtotal" nilai={rupiah(subtotal)} />
              {ppnPersen > 0 && <BarisRingkas label={`PPN ${ppnPersen}%`} nilai={rupiah(ppnNominal)} />}
              <div className="flex justify-between border-t border-dashed border-black/15 pt-2 text-base font-bold">
                <span>Total</span>
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
              Bayar Sekarang
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
    </div>
  )
}
