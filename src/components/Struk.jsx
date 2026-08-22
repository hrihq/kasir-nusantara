import { rupiah, tanggalLengkap } from '../lib/format.js'
import { t } from '../lib/bahasa.js'

function Garis() {
  return <div className="my-1.5 border-t border-dashed border-black/60" />
}

function Baris({ label, nilai }) {
  return (
    <div className="flex justify-between gap-2">
      <span>{label}</span>
      <span>{nilai}</span>
    </div>
  )
}

export function Struk({ trx, pengaturan }) {
  const { namaToko, alamat, telepon, catatanStruk, logo } = pengaturan
  const metode = t(trx.metode)
  return (
    <div className="kertas-struk mx-auto w-full max-w-[300px] rounded-2xl bg-white p-4 font-struk text-[11px] leading-snug text-tinta shadow-kartu">
      <div className="text-center">
        {logo && <img src={logo} alt="" className="mx-auto mb-1 h-14 object-contain" />}
        <div className="text-[13px] font-bold uppercase tracking-wide">{namaToko}</div>
        {alamat && <div>{alamat}</div>}
        {telepon && (
          <div>
            {t('Telp.')} {telepon}
          </div>
        )}
      </div>
      <Garis />
      <div className="flex justify-between">
        <span>{t('No.')}</span>
        <span>{trx.no}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span>{tanggalLengkap(trx.tanggal)}</span>
        <span>{metode}</span>
      </div>
      <Garis />
      {trx.item.map((it, i) => (
        <div key={i} className="mb-1">
          <div>{it.nama}</div>
          <div className="flex justify-between">
            <span>
              {it.qty} x {rupiah(it.harga)}
            </span>
            <span>{rupiah(it.qty * it.harga)}</span>
          </div>
        </div>
      ))}
      <Garis />
      <Baris label={t('Subtotal')} nilai={rupiah(trx.subtotal)} />
      {trx.ppnPersen > 0 && (
        <Baris label={`${t('PPN')} ${trx.ppnPersen}%`} nilai={rupiah(trx.ppnNominal)} />
      )}
      <div className="flex justify-between py-0.5 text-[13px] font-bold">
        <span>{t('TOTAL')}</span>
        <span>{rupiah(trx.total)}</span>
      </div>
      <Baris
        label={metode === t('Tunai') ? metode : `${t('Bayar')} (${metode})`}
        nilai={rupiah(trx.bayar)}
      />
      {trx.metode === 'Tunai' && <Baris label={t('Kembali')} nilai={rupiah(trx.kembalian)} />}
      <Garis />
      {catatanStruk && <div className="text-center">{catatanStruk}</div>}
      <div className="mt-1 text-center text-[9px] uppercase tracking-widest text-black/40">
        -- Kasir Nusantara --
      </div>
    </div>
  )
}
