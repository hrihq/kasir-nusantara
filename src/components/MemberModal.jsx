import { useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { rupiah } from '../lib/format.js'
import { t } from '../lib/bahasa.js'
import { Modal } from './Modal.jsx'
import Ikon from './Ikon.jsx'

const KOSONG = { nama: '', telepon: '', diskonPersen: '' }

export default function MemberModal({ buka, tutup }) {
  const { members, setMembers } = useStore()
  const [form, setForm] = useState(KOSONG)
  const [editId, setEditId] = useState(null)
  const [cari, setCari] = useState('')

  const simpan = () => {
    const nama = form.nama.trim()
    const telepon = form.telepon.trim()
    if (!nama) return
    const item = {
      nama,
      telepon,
      diskonPersen: Number(form.diskonPersen) || 0,
    }
    if (editId) {
      setMembers((ms) => ms.map((m) => (m.id === editId ? { ...m, ...item } : m)))
    } else {
      setMembers((ms) => [
        { id: Date.now().toString(36), ...item, totalBelanja: 0, jumlahTransaksi: 0, bergabung: new Date().toISOString() },
        ...ms,
      ])
    }
    setForm(KOSONG)
    setEditId(null)
  }

  const hapus = (id) => {
    if (!confirm(t('Hapus member ini?'))) return
    setMembers((ms) => ms.filter((m) => m.id !== id))
  }

  const mulaiEdit = (m) => {
    setForm({ nama: m.nama, telepon: m.telepon || '', diskonPersen: String(m.diskonPersen || '') })
    setEditId(m.id)
  }

  const batalEdit = () => { setForm(KOSONG); setEditId(null) }

  const hasil = members.filter(
    (m) =>
      m.nama.toLowerCase().includes(cari.toLowerCase()) ||
      (m.telepon && m.telepon.includes(cari)),
  )

  return (
    <Modal open={buka} onClose={tutup} judul={t('Manajemen Member')}>
      <div className="space-y-3 max-h-[70vh] overflow-y-auto no-scrollbar">
        {/* Form */}
        <div className="rounded-2xl bg-white p-4 shadow-kartu space-y-2.5">
          <input className="input" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} placeholder={t('Nama member')} />
          <input className="input" value={form.telepon} onChange={(e) => setForm((f) => ({ ...f, telepon: e.target.value }))} placeholder={t('No. telepon (opsional)')} inputMode="numeric" />
          <div className="relative">
            <input type="number" className="input pr-8" min="0" max="100" value={form.diskonPersen} onChange={(e) => setForm((f) => ({ ...f, diskonPersen: e.target.value }))} placeholder={t('Diskon khusus member (%)')} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-black/40">%</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={batalEdit} className="tombol--hantu w-full">{t('Batal')}</button>
            <button onClick={simpan} className="tombol--utama w-full">{editId ? t('Simpan') : t('Tambah')}</button>
          </div>
        </div>

        {/* Pencarian */}
        <input className="input" value={cari} onChange={(e) => setCari(e.target.value)} placeholder={t('Cari member…')} />

        {/* Daftar member */}
        {hasil.length === 0 && (
          <p className="py-4 text-center text-xs text-black/40">{t('Belum ada member.')}</p>
        )}
        {hasil.map((m) => (
          <div key={m.id} className="rounded-2xl bg-white p-3 shadow-kartu">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold">{m.nama}</span>
                  {m.diskonPersen > 0 && (
                    <span className="rounded-full bg-merek/10 px-2 py-0.5 text-[10px] font-bold text-merek">
                      {m.diskonPersen}% {t('off')}
                    </span>
                  )}
                </div>
                {m.telepon && <div className="text-[11px] text-black/45">{m.telepon}</div>}
                <div className="text-[11px] text-black/45">
                  {t('Belanja')} {rupiah(m.totalBelanja)} · {m.jumlahTransaksi} {t('transaksi')}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => mulaiEdit(m)} className="rounded-full p-1.5 text-black/40 hover:bg-krem-tua">
                  <Ikon nama="edit" className="h-4 w-4" />
                </button>
                <button onClick={() => hapus(m.id)} className="rounded-full p-1.5 text-red-400 hover:bg-red-50">
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
