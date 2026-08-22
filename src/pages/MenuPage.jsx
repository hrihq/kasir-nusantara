import { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { rupiah, buatId } from '../lib/format.js'
import { bacaGambarKecil } from '../lib/gambar.js'
import PageHeader from '../components/PageHeader.jsx'
import Ikon from '../components/Ikon.jsx'
import ProdukAvatar from '../components/ProdukAvatar.jsx'
import { Modal } from '../components/Modal.jsx'

const KOSONG = { nama: '', harga: '', kategori: '', baru: '', gambar: null }

export default function MenuPage() {
  const { produk, setProduk, setKeranjang, pengaturan } = useStore()
  const [formBuka, setFormBuka] = useState(false)
  const [sedangEdit, setSedangEdit] = useState(null)
  const [form, setForm] = useState(KOSONG)
  const [pinBuka, setPinBuka] = useState(false)
  const [pinMasuk, setPinMasuk] = useState('')
  const [pinSalah, setPinSalah] = useState(false)
  const [aksiTunda, setAksiTunda] = useState(null)

  const pinBenar = pengaturan.pinKode || ''

  const denganPin = (aksi) => {
    if (pengaturan.pinAktif && pengaturan.pinKode) {
      setAksiTunda(() => aksi)
      setPinMasuk('')
      setPinSalah(false)
      setPinBuka(true)
    } else {
      aksi()
    }
  }

  const konfirmasiPin = () => {
    if (pinMasuk === pinBenar) {
      const aksi = aksiTunda
      setPinBuka(false)
      setAksiTunda(null)
      aksi?.()
    } else {
      setPinSalah(true)
      setPinMasuk('')
    }
  }

  const batalPin = () => {
    setPinBuka(false)
    setAksiTunda(null)
    setPinMasuk('')
    setPinSalah(false)
  }

  const kategoriAda = useMemo(() => [...new Set(produk.map((p) => p.kategori))], [produk])

  const grup = useMemo(() => {
    const m = new Map()
    for (const p of produk) {
      if (!m.has(p.kategori)) m.set(p.kategori, [])
      m.get(p.kategori).push(p)
    }
    return [...m.entries()]
  }, [produk])

  const bukaTambah = () => {
    setSedangEdit(null)
    setForm(KOSONG)
    setFormBuka(true)
  }

  const bukaEdit = (p) => {
    setSedangEdit(p)
    setForm({ nama: p.nama, harga: String(p.harga), kategori: p.kategori, baru: '', gambar: p.gambar || null })
    setFormBuka(true)
  }

  const unggahFoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await bacaGambarKecil(file)
      setForm((f) => ({ ...f, gambar: dataUrl }))
    } catch {
      /* abaikan berkas tidak valid */
    }
    e.target.value = ''
  }

  const simpan = () => {
    const nama = form.nama.trim()
    const harga = Math.round(Number(form.harga))
    const kategori = (form.kategori === '__baru__' ? form.baru : form.kategori).trim()
    if (!nama || !(harga > 0) || !kategori) return

    if (sedangEdit) {
      setProduk((ps) =>
        ps.map((p) =>
          p.id === sedangEdit.id ? { ...p, nama, harga, kategori, gambar: form.gambar } : p,
        ),
      )
    } else {
      setProduk((ps) => [
        { id: buatId(), nama, harga, kategori, gambar: form.gambar },
        ...ps,
      ])
    }
    setFormBuka(false)
  }

  const hapus = (p) => {
    if (!confirm(`Hapus "${p.nama}" dari menu?`)) return
    setProduk((ps) => ps.filter((x) => x.id !== p.id))
    setKeranjang((k) => k.filter((x) => x.id !== p.id))
  }

  return (
    <div className="pb-32">
      <PageHeader
        judul="Kelola Menu"
        sub={`${produk.length} menu tersedia`}
        kanan={
          <button onClick={() => denganPin(bukaTambah)} className="tombol--utama mt-1 !px-3.5 !py-2.5 text-sm">
            <Ikon nama="plus" className="h-4 w-4" />
            Tambah
          </button>
        }
      />

      <div className="space-y-6 px-5">
        {grup.map(([kat, daftar]) => (
          <section key={kat}>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-black/40">{kat}</h2>
            <ul className="grid gap-2 lg:grid-cols-2">
              {daftar.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-kartu">
                  <ProdukAvatar produk={p} className="h-11 w-11 shrink-0 rounded-xl text-sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{p.nama}</div>
                    <div className="text-sm font-bold text-merek">{rupiah(p.harga)}</div>
                  </div>
                  <button
                    onClick={() => denganPin(() => bukaEdit(p))}
                    className="rounded-full p-2 text-black/45 transition duration-200 hover:bg-krem-tua"
                    aria-label={`Edit ${p.nama}`}
                  >
                    <Ikon nama="edit" className="h-[18px] w-[18px]" />
                  </button>
                  <button
                    onClick={() => denganPin(() => hapus(p))}
                    className="rounded-full p-2 text-red-400 transition duration-200 hover:bg-red-50"
                    aria-label={`Hapus ${p.nama}`}
                  >
                    <Ikon nama="hapus" className="h-[18px] w-[18px]" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {produk.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-black/35">
            <Ikon nama="kotak" className="h-8 w-8" />
            <p className="text-sm">Belum ada menu. Ketuk “Tambah” untuk membuat menu pertama.</p>
          </div>
        )}
      </div>

      <Modal open={formBuka} onClose={() => setFormBuka(false)} judul={sedangEdit ? 'Edit Menu' : 'Tambah Menu'}>
        <div className="space-y-4">
          <div>
            <span className="label">Foto Menu</span>
            <div className="flex items-center gap-3">
              <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-krem-tua text-black/30">
                {form.gambar ? (
                  <img src={form.gambar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Ikon nama="foto" className="h-6 w-6" />
                )}
              </span>
              <div className="space-y-1">
                <label className="tombol--hantu cursor-pointer !px-3 !py-2 text-xs">
                  {form.gambar ? 'Ganti Foto' : 'Unggah Foto'}
                  <input type="file" accept="image/*" className="hidden" onChange={unggahFoto} />
                </label>
                {form.gambar && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, gambar: null }))}
                    className="block text-xs text-red-500 underline underline-offset-2"
                  >
                    Hapus foto
                  </button>
                )}
                <p className="text-[11px] leading-snug text-black/35">
                  JPG/PNG — otomatis dikompres agar hemat penyimpanan.
                </p>
              </div>
            </div>
          </div>

          <div>
            <span className="label">Nama Menu</span>
            <input
              className="input"
              value={form.nama}
              onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
              placeholder="cth. Ayam Bakar Madu"
            />
          </div>

          <div>
            <span className="label">Harga (Rp)</span>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min="0"
              value={form.harga}
              onChange={(e) => setForm((f) => ({ ...f, harga: e.target.value }))}
              placeholder="15000"
            />
          </div>

          <div>
            <span className="label">Kategori</span>
            <select
              className="input"
              value={form.kategori}
              onChange={(e) => setForm((f) => ({ ...f, kategori: e.target.value }))}
            >
              <option value="" disabled>
                Pilih kategori…
              </option>
              {kategoriAda.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
              <option value="__baru__">+ Kategori Baru</option>
            </select>
            {form.kategori === '__baru__' && (
              <input
                className="input mt-2"
                value={form.baru}
                onChange={(e) => setForm((f) => ({ ...f, baru: e.target.value }))}
                placeholder="Nama kategori baru"
              />
            )}
          </div>

          <button onClick={simpan} className="tombol--utama w-full">
            {sedangEdit ? 'Simpan Perubahan' : 'Tambah ke Menu'}
          </button>
        </div>
      </Modal>

      <Modal open={pinBuka} onClose={batalPin} judul="Masukkan PIN">
        <p className="text-sm text-black/55">Masukkan PIN pengelola menu untuk melanjutkan.</p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pinMasuk}
          onChange={(e) => {
            setPinMasuk(e.target.value.replace(/\D/g, '').slice(0, 8))
            setPinSalah(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') konfirmasiPin()
          }}
          placeholder="• • • •"
          className={`input mt-3 text-center text-lg font-bold tracking-[0.5em] ${
            pinSalah ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''
          }`}
        />
        {pinSalah && (
          <p className="mt-2 text-center text-xs font-semibold text-red-500">
            PIN salah. Coba lagi.
          </p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={batalPin} className="tombol--hantu w-full">
            Batal
          </button>
          <button onClick={konfirmasiPin} disabled={!pinMasuk} className="tombol--utama w-full">
            Buka
          </button>
        </div>
      </Modal>
    </div>
  )
}
