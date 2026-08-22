import { createPortal } from 'react-dom'
import Ikon from './Ikon.jsx'

export function Modal({ open, onClose, judul, children }) {
  if (!open) return null
  return createPortal(
    <div className="anim-pudar fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-tinta/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="anim-naik relative flex max-h-[94vh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-3xl bg-krem shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between px-5 pb-1 pt-4">
          <h2 className="font-judul text-xl">{judul}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-black/50 transition duration-200 hover:bg-black/5"
            aria-label="Tutup"
          >
            <Ikon nama="silang" className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-7 pt-2">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
