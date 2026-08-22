import Ikon from './Ikon.jsx'
import { Modal } from './Modal.jsx'
import { Struk } from './Struk.jsx'
import { t } from '../lib/bahasa.js'

export function StrukModal({ trx, pengaturan, onClose }) {
  return (
    <Modal open={!!trx} onClose={onClose} judul={t('Struk Transaksi')}>
      {trx && (
        <>
          <Struk trx={trx} pengaturan={pengaturan} />
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button className="tombol--hantu" onClick={() => window.print()}>
              <Ikon nama="cetak" className="h-[18px] w-[18px]" />
              {t('Cetak')}
            </button>
            <button className="tombol--utama" onClick={onClose}>
              {t('Selesai')}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
