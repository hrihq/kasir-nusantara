import { useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { rupiah } from '../lib/format.js'
import { t } from '../lib/bahasa.js'
import { Modal } from './Modal.jsx'
import Ikon from './Ikon.jsx'

const TIPE_DISKON = [
  { id: 'persen', label: 'Persen (%)' },
  { id: 'nominal', label: 'Nominal (Rp)' },
]

const BERLAKU = [
  { id: 'semua', label: 'Semua Item' },
  { id: 'kategori', label: 'Per Kategori' },
  { id: 'produk', label: 'Per Produk' },
]

const KOSONG = { nama: '', tipe: 'persen', nilai: '', berlakuUntuk: 'semua', targetId: '', minPembelian: '' }

export default function DiskonModal({ buka, tutup }) {
  const { diskonList, setDiskonList, produk } = useStore()
  const [form, setForm] = useState(KOSONG)
  const [editId, setEditId] = useState(null)

  const kategoriList = [...new Set(produk.map((p) => p.kategori))]

  const simpan = () => {
    const nama = form.nama.trim()
    const nilai = Number(form.nilai)
    if (!nama || !(nilai > 0)) return
    const item = {
      ...form,
      nama,
      nilai,
      minPembelian: Number(form.minPembelian) || 0,
      aktif: true,
    }
    if (editId) {
      setDiskonList((ds) => ds.map((d) => (d.id === editId ? { ...d, ...item } : d)))
    } else {
      setDiskonList((ds) => [{ id: Date.now().toString(36), ...item }, ...ds])
    }
    setForm(KOSONG)
    setEditId(null)
  }

  const hapus = (id) => {
    if (!confirm(t('Hapus diskon ini?'))) return
    setDiskonList((ds) => ds.filter((d) => d.id !== id))
  }

  const mulaiEdit = (d) => {
    setForm({ nama: d.nama, tipe: d.tipe, nilai: String(d.nilai), berlakuUntuk: d.berlakuUntuk, targetId: d.targetId || '', minPembelian: String(d.minPembelian || '') })
    setEditId(d.id)
  }

  const batalEdit = () => { setForm(KOSONG); setEditId(null) }

  const toggleAktif = (id) => {
    setDiskonList((ds) => ds.map((d) => (d.id === id ? { ...d, aktif: !d.aktif } : d)))
  }

  return (
    <Modal open={buka} onClose={tutup} judul={t('Manajemen Diskon')}>
      <div className="space-y-3 max-h-[70vh] overflow-y-auto no-scrollbar">
        {/* Form */}
        <div className="rounded-2xl bg-white p-4 shadow-kartu space-y-2.5">
          <input
            className="input"
            value={form.nama}
            onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
            placeholder={t('Nama diskon, cth. Diskon Akhir Pekan')}
          />
          <div className="grid grid-cols-2 gap-2">
            <select className="input" value={form.tipe} onChange={(e) => setForm((f) => ({ ...f, tipe: e.target.value }))}>
              {TIPE_DISKON.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <div className="relative">
              <input type="number" className="input pr-8" min="0" value={form.nilai} onChange={(e) => setForm((f) => ({ ...f, nilai: e.target.value }))} placeholder={form.tipe === 'persen' ? '10' : '5000'} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-black/40">{form.tipe === 'persen' ? '%' : 'Rp'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="input" value={form.berlakuUntuk} onChange={(e) => setForm((f) => ({ ...f, berlakuUntuk: e.target.value, targetId: '' }))}>
              {BERLAKU.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
            {form.berlakuUntuk === 'kategori' && (
              <select className="input" value={form.targetId} onChange={(e) => setForm((f) => ({ ...f, targetId: e.target.value }))}>
                <option value="">{t('Pilih kategori')}</option>
                {kategoriList.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            )}
            {form.berlakuUntuk === 'produk' && (
              <select className="input" value={form.targetId} onChange={(e) => setForm((f) => ({ ...f, targetId: e.target.value }))}>
                <option value="">{t('Pilih produk')}</option>
                {produk.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
            )}
          </div>
          <div>
            <span className="label">{t('Min. Pembelian (Rp)')}</span>
            <input type="number" className="input" min="0" value={form.minPembelian} onChange={(e) => setForm((f) => ({ ...f, minPembelian: e.target.value }))} placeholder="0 (tanpa batas)" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={batalEdit} className="tombol--hantu w-full">{t('Batal')}</button>
            <button onClick={simpan} className="tombol--utama w-full">{editId ? t('Simpan') : t('Tambah')}</button>
          </div>
        </div>

        {/* Daftar diskon */}
        {diskonList.length === 0 && (
          <p className="py-4 text-center text-xs text-black/40">{t('Belum ada diskon.')}</p>
        )}
        {diskonList.map((d) => (
          <div key={d.id} className={`rounded-2xl bg-white p-3 shadow-kartu ${!d.aktif ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-bold">{d.nama}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    d.tipe === 'persen' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {d.tipe === 'persen' ? `${d.nilai}%` : rupiah(d.nilai)}
                  </span>
                </div>
                <div className="text-[11px] text-black/45">
                  {d.berlakuUntuk === 'semua' ? t('Semua item') : d.berlakuUntuk === 'kategori' ? `${t('Kategori')}: ${d.targetId}` : `${t('Produk')}: ${produk.find((p) => p.id === d.targetId)?.nama || '-'}`}
                  {d.minPembelian > 0 && ` · ${t('Min.')} ${rupiah(d.minPembelian)}`}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleAktif(d.id)} className={`rounded-full p-1.5 ${d.aktif ? 'text-emerald-500' : 'text-black/25'}`}>
                  <Ikon nama={d.aktif ? 'matahari' : 'bulan'} className="h-4 w-4" />
                </button>
                <button onClick={() => mulaiEdit(d)} className="rounded-full p-1.5 text-black/40 hover:bg-krem-tua">
                  <Ikon nama="edit" className="h-4 w-4" />
                </button>
                <button onClick={() => hapus(d.id)} className="rounded-full p-1.5 text-red-400 hover:bg-red-50">
                  <Ikon nama="hapus" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
