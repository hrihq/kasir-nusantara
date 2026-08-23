import { useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { rupiah } from '../lib/format.js'
import { t } from '../lib/bahasa.js'
import Ikon from './Ikon.jsx'
import { Modal } from './Modal.jsx'

export default function MemberDiskonKartu() {
  const { members, setMembers, diskonList, setDiskonList, produk } = useStore()
  const [tab, setTab] = useState(null)
  const [fm, setFm] = useState({ nama: '', telepon: '', diskonPersen: '' })
  const [fd, setFd] = useState({ nama: '', tipe: 'persen', nilai: '', berlakuUntuk: 'semua', targetId: '', minPembelian: '' })
  const [editId, setEditId] = useState(null)
  const [cari, setCari] = useState('')

  const kategoriList = [...new Set(produk.map((p) => p.kategori))]

  const simpanMember = () => {
    const nama = fm.nama.trim()
    if (!nama) return
    if (editId) {
      setMembers((ms) => ms.map((m) => m.id === editId ? { ...m, nama, telepon: fm.telepon.trim(), diskonPersen: Number(fm.diskonPersen) || 0 } : m))
    } else {
      setMembers((ms) => [{ id: Date.now().toString(36), nama, telepon: fm.telepon.trim(), diskonPersen: Number(fm.diskonPersen) || 0, totalBelanja: 0, jumlahTransaksi: 0, bergabung: new Date().toISOString() }, ...ms])
    }
    setFm({ nama: '', telepon: '', diskonPersen: '' })
    setEditId(null)
  }

  const hapusMember = (id) => { if (confirm(t('Hapus member ini?'))) setMembers((ms) => ms.filter((m) => m.id !== id)) }

  const simpanDiskon = () => {
    const nama = fd.nama.trim()
    const nilai = Number(fd.nilai)
    if (!nama || !(nilai > 0)) return
    const item = { nama, tipe: fd.tipe, nilai, berlakuUntuk: fd.berlakuUntuk, targetId: fd.targetId, minPembelian: Number(fd.minPembelian) || 0, aktif: true }
    if (editId) {
      setDiskonList((ds) => ds.map((d) => d.id === editId ? { ...d, ...item } : d))
    } else {
      setDiskonList((ds) => [{ id: Date.now().toString(36), ...item }, ...ds])
    }
    setFd({ nama: '', tipe: 'persen', nilai: '', berlakuUntuk: 'semua', targetId: '', minPembelian: '' })
    setEditId(null)
  }

  const hapusDiskon = (id) => { if (confirm(t('Hapus diskon ini?'))) setDiskonList((ds) => ds.filter((d) => d.id !== id)) }

  const filteredMembers = members.filter((m) => m.nama.toLowerCase().includes(cari.toLowerCase()) || (m.telepon && m.telepon.includes(cari)))

  return (
    <>
      <div className="kartu mx-5 mt-4">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { setTab('member'); setEditId(null); setCari('') }} className="tombol !py-2.5 text-xs ring-1 ring-black/10 hover:bg-krem-tua">
            <Ikon nama="kunci" className="mr-1 inline h-3.5 w-3.5" />
            {t('Member')} ({members.length})
          </button>
          <button onClick={() => { setTab('diskon'); setEditId(null) }} className="tombol !py-2.5 text-xs ring-1 ring-black/10 hover:bg-krem-tua">
            <Ikon nama="grafik" className="mr-1 inline h-3.5 w-3.5" />
            {t('Diskon')} ({diskonList.length})
          </button>
        </div>
      </div>

      {/* Modal Member */}
      <Modal open={tab === 'member'} onClose={() => setTab(null)} judul={t('Manajemen Member')}>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="rounded-2xl bg-white p-4 shadow-kartu space-y-2">
            <input className="input" value={fm.nama} onChange={(e) => setFm((f) => ({ ...f, nama: e.target.value }))} placeholder={t('Nama member')} />
            <input className="input" value={fm.telepon} onChange={(e) => setFm((f) => ({ ...f, telepon: e.target.value }))} placeholder={t('No. telepon')} inputMode="numeric" />
            <div className="relative">
              <input type="number" className="input pr-8" min="0" max="100" value={fm.diskonPersen} onChange={(e) => setFm((f) => ({ ...f, diskonPersen: e.target.value }))} placeholder={t('Diskon member (%)')} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-black/40">%</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setFm({ nama: '', telepon: '', diskonPersen: '' }); setEditId(null) }} className="tombol--hantu w-full">{t('Batal')}</button>
              <button onClick={simpanMember} className="tombol--utama w-full">{editId ? t('Simpan') : t('Tambah')}</button>
            </div>
          </div>
          <input className="input" value={cari} onChange={(e) => setCari(e.target.value)} placeholder={t('Cari member…')} />
          {filteredMembers.length === 0 && <p className="py-4 text-center text-xs text-black/40">{t('Belum ada member.')}</p>}
          {filteredMembers.map((m) => (
            <div key={m.id} className="rounded-2xl bg-white p-3 shadow-kartu">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold">{m.nama}</span>
                    {m.diskonPersen > 0 && <span className="rounded-full bg-merek/10 px-2 py-0.5 text-[10px] font-bold text-merek">{m.diskonPersen}% off</span>}
                  </div>
                  {m.telepon && <div className="text-[11px] text-black/45">{m.telepon}</div>}
                  <div className="text-[11px] text-black/45">{rupiah(m.totalBelanja)} · {m.jumlahTransaksi} trx</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setFm({ nama: m.nama, telepon: m.telepon || '', diskonPersen: String(m.diskonPersen || '') }); setEditId(m.id) }} className="rounded-full p-1.5 text-black/40"><Ikon nama="edit" className="h-4 w-4" /></button>
                  <button onClick={() => hapusMember(m.id)} className="rounded-full p-1.5 text-red-400"><Ikon nama="hapus" className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal Diskon */}
      <Modal open={tab === 'diskon'} onClose={() => setTab(null)} judul={t('Manajemen Diskon')}>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="rounded-2xl bg-white p-4 shadow-kartu space-y-2">
            <input className="input" value={fd.nama} onChange={(e) => setFd((f) => ({ ...f, nama: e.target.value }))} placeholder={t('Nama diskon')} />
            <div className="grid grid-cols-2 gap-2">
              <select className="input" value={fd.tipe} onChange={(e) => setFd((f) => ({ ...f, tipe: e.target.value }))}>
                <option value="persen">Persen (%)</option>
                <option value="nominal">Nominal (Rp)</option>
              </select>
              <input type="number" className="input" min="0" value={fd.nilai} onChange={(e) => setFd((f) => ({ ...f, nilai: e.target.value }))} placeholder={fd.tipe === 'persen' ? '10' : '5000'} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select className="input" value={fd.berlakuUntuk} onChange={(e) => setFd((f) => ({ ...f, berlakuUntuk: e.target.value, targetId: '' }))}>
                <option value="semua">Semua Item</option>
                <option value="kategori">Per Kategori</option>
                <option value="produk">Per Produk</option>
              </select>
              {fd.berlakuUntuk === 'kategori' && (
                <select className="input" value={fd.targetId} onChange={(e) => setFd((f) => ({ ...f, targetId: e.target.value }))}>
                  <option value="">Pilih kategori</option>
                  {kategoriList.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              )}
              {fd.berlakuUntuk === 'produk' && (
                <select className="input" value={fd.targetId} onChange={(e) => setFd((f) => ({ ...f, targetId: e.target.value }))}>
                  <option value="">Pilih produk</option>
                  {produk.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              )}
            </div>
            <input type="number" className="input" min="0" value={fd.minPembelian} onChange={(e) => setFd((f) => ({ ...f, minPembelian: e.target.value }))} placeholder={t('Min. pembelian (Rp), 0 = tanpa batas')} />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setFd({ nama: '', tipe: 'persen', nilai: '', berlakuUntuk: 'semua', targetId: '', minPembelian: '' }); setEditId(null) }} className="tombol--hantu w-full">{t('Batal')}</button>
              <button onClick={simpanDiskon} className="tombol--utama w-full">{editId ? t('Simpan') : t('Tambah')}</button>
            </div>
          </div>
          {diskonList.length === 0 && <p className="py-4 text-center text-xs text-black/40">{t('Belum ada diskon.')}</p>}
          {diskonList.map((d) => (
            <div key={d.id} className={`rounded-2xl bg-white p-3 shadow-kartu ${!d.aktif ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold">{d.nama}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${d.tipe === 'persen' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {d.tipe === 'persen' ? `${d.nilai}%` : rupiah(d.nilai)}
                    </span>
                  </div>
                  <div className="text-[11px] text-black/45">
                    {d.berlakuUntuk === 'semua' ? 'Semua item' : d.berlakuUntuk === 'kategori' ? `Kategori: ${d.targetId}` : `Produk: ${produk.find((p) => p.id === d.targetId)?.nama || '-'}`}
                    {d.minPembelian > 0 && ` · Min. ${rupiah(d.minPembelian)}`}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setDiskonList((ds) => ds.map((x) => x.id === d.id ? { ...x, aktif: !x.aktif } : x))} className={`rounded-full p-1.5 ${d.aktif ? 'text-emerald-500' : 'text-black/25'}`}><Ikon nama={d.aktif ? 'matahari' : 'bulan'} className="h-4 w-4" /></button>
                  <button onClick={() => { setFd({ nama: d.nama, tipe: d.tipe, nilai: String(d.nilai), berlakuUntuk: d.berlakuUntuk, targetId: d.targetId || '', minPembelian: String(d.minPembelian || '') }); setEditId(d.id) }} className="rounded-full p-1.5 text-black/40"><Ikon nama="edit" className="h-4 w-4" /></button>
                  <button onClick={() => hapusDiskon(d.id)} className="rounded-full p-1.5 text-red-400"><Ikon nama="hapus" className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  )
}
