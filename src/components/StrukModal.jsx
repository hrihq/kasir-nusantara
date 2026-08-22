import Ikon from './Ikon.jsx'
import { Modal } from './Modal.jsx'
import { Struk } from './Struk.jsx'

export function StrukModal({ trx, pengaturan, onClose }) {
  return (
    <Modal open={!!trx} onClose={onClose} judul="Struk Transaksi">
      {trx && (
        <>
          <Struk trx={trx} pengaturan={pengaturan} />
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button className="tombol--hantu" onClick={() => window.print()}>
              <Ikon nama="cetak" className="h-[18px] w-[18px]" />
              Cetak
            </button>
            <button className="tombol--utama" onClick={onClose}>
              Selesai
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
