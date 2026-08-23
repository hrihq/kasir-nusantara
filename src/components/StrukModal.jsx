import { Capacitor } from '@capacitor/core'
import Ikon from './Ikon.jsx'
import { Modal } from './Modal.jsx'
import { Struk } from './Struk.jsx'
import { t } from '../lib/bahasa.js'
import { cetakStruk, infoPrinter } from '../lib/printer.js'
import { cetakStrukPdf } from '../lib/pdf.js'

export function StrukModal({ trx, pengaturan, onClose }) {
  const cetak = async () => {
    if (!trx) return
    const printer = infoPrinter()
    if (Capacitor.isNativePlatform() && printer) {
      try {
        await cetakStruk(trx, pengaturan)
        navigator.vibrate?.(30)
        return
      } catch {
        // Printer gagal → jatuh ke PDF
      }
    }
    try {
      await cetakStrukPdf(trx, pengaturan)
      navigator.vibrate?.(30)
    } catch {
      /* dibatalkan pengguna */
    }
  }

  return (
    <Modal open={!!trx} onClose={onClose} judul={t('Struk Transaksi')}>
      {trx && (
        <>
          <Struk trx={trx} pengaturan={pengaturan} />
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button className="tombol--hantu" onClick={cetak}>
              <Ikon nama="cetak" className="h-[18px] w-[18px]" />
              {infoPrinter() ? t('Cetak ke Bluetooth') : t('Bagikan Struk')}
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
