import { useState } from 'react'
import { rupiah } from '../lib/format.js'
import { t } from '../lib/bahasa.js'
import Ikon from './Ikon.jsx'
import { Modal } from './Modal.jsx'

export function PilihSheet({ open, onClose, judul, items, terpilih, onSelect, render, kosong }) {
  const [cari, setCari] = useState('')

  const filtered = items.filter((item) => {
    if (!cari) return true
    const q = cari.toLowerCase()
    return (item.label || item.nama || '').toLowerCase().includes(q) ||
           (item.sub || '').toLowerCase().includes(q)
  })

  const handleSelect = (item) => {
    onSelect(item.id || item)
    setCari('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} judul={judul}>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar">
        <input
          className="input"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder={`${t('Cari')}…`}
          autoFocus
        />
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-black/40">{kosong || t('Tidak ditemukan.')}</p>
        ) : (
          filtered.map((item) => (
            <button
              key={item.id || item}
              onClick={() => handleSelect(item)}
              className={`w-full text-left rounded-2xl p-3 transition-all ${
                terpilih === (item.id || item)
                  ? 'bg-merek/10 ring-2 ring-merek'
                  : 'bg-white shadow-kartu hover:bg-krem/40'
              }`}
            >
              {render ? render(item) : (
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-bold">{item.label || item.nama}</span>
                      {item.badge && (
                        <span className="rounded-full bg-merek/10 px-2 py-0.5 text-[10px] font-bold text-merek">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.sub && <div className="text-[11px] text-black/45">{item.sub}</div>}
                  </div>
                  {terpilih === (item.id || item) && (
                    <Ikon nama="centang" className="h-5 w-5 shrink-0 text-merek" />
                  )}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </Modal>
  )
}
