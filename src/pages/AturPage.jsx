import { useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { rupiah } from '../lib/format.js'
import { bacaGambarKecil } from '../lib/gambar.js'
import { pakaiTema } from '../lib/tema.js'
import { izinNotifikasi, jadwalkanPengingat } from '../lib/notif.js'
import PageHeader from '../components/PageHeader.jsx'
import PesanPudar from '../components/PesanPudar.jsx'
import { Modal } from '../components/Modal.jsx'

export default function AturPage() {
  const { pengaturan, setPengaturan, transaksi, setTransaksi, pengeluaran, setPengeluaran } =
    useStore()
  const [gelap, gantiTema] = pakaiTema()
  const [pinLama, setPinLama] = useState('')
  const [pinBaru, setPinBaru] = useState('')
  const [pinUlang, setPinUlang] = useState('')
  const [gantiBuka, setGantiBuka] = useState(false)
  const [pesanPin, setPesanPin] = useState(null)
  const [matriMati, setMatriMati] = useState(false)
  const [pinMati, setPinMati] = useState('')

  const pinTersimpan = pengaturan.pinKode || ''

  const bersihkanFormPin = () => {
    setPinLama('')
    setPinBaru('')
    setPinUlang('')
  }

  const simpanPin = () => {
    if (pinTersimpan && pinLama !== pinTersimpan) {
      setPesanPin({ ok: false, teks: 'PIN lama salah.' })
      return
    }
    if (!/^\d{4,8}$/.test(pinBaru)) {
      setPesanPin({ ok: false, teks: 'PIN harus 4–8 angka.' })
      return
    }
    if (pinBaru !== pinUlang) {
      setPesanPin({ ok: false, teks: 'Ketikan ulang PIN belum sama.' })
      return
    }
    ubah('pinKode', pinBaru)
    bersihkanFormPin()
    setGantiBuka(false)
    setPesanPin({ ok: true, teks: pinTersimpan ? 'PIN berhasil diganti.' : 'PIN aktif. Menu terkunci.' })
  }

  const saklarKunci = () => {
    setPesanPin(null)
    if (pengaturan.pinAktif) {
      if (!pinTersimpan) {
        ubah('pinAktif', false)
        setGantiBuka(false)
        bersihkanFormPin()
        setPesanPin({ ok: true, teks: 'Kunci menu dimatikan.' })
        return
      }
      setPinMati('')
      setMatriMati(true)
    } else {
      ubah('pinAktif', true)
      setGantiBuka(!pinTersimpan)
    }
  }

  const konfirmasiMatikan = () => {
    if (pinMati !== pinTersimpan) {
      setPesanPin({ ok: false, teks: 'PIN lama salah. Kunci tetap menyala.' })
      setMatriMati(false)
      return
    }
    ubah('pinAktif', false)
    setMatriMati(false)
    setGantiBuka(false)
    bersihkanFormPin()
    setPesanPin({ ok: true, teks: 'Kunci menu dimatikan.' })
  }

  const ubahPengingat = async (aktif, jam) => {
    if (aktif) {
      const izin = await izinNotifikasi()
      if (izin !== 'granted') {
        alert('Izin notifikasi ditolak. Aktifkan izin notifikasi untuk aplikasi ini di pengaturan HP.')
        return
      }
    }
    const berhasil = await jadwalkanPengingat(aktif, jam)
    setPengaturan((s) => ({ ...s, pengingatAktif: aktif && berhasil, pengingatJam: jam }))
  }

  const ubah = (field, nilai) => setPengaturan((s) => ({ ...s, [field]: nilai }))

  const unggahLogo = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      ubah('logo', await bacaGambarKecil(file, 256, 'image/png'))
    } catch {
      /* abaikan berkas tidak valid */
    }
    e.target.value = ''
  }

  const resetTransaksi = () => {
    if (!confirm('Hapus semua riwayat transaksi & pengeluaran?')) return
    setTransaksi([])
    setPengeluaran([])
  }

  const resetSemua = () => {
    if (!confirm('PERMANEN: hapus SEMUA data (menu, transaksi, pengaturan) lalu muat ulang?')) return
    for (const k of [
      'kasir_produk',
      'kasir_transaksi',
      'kasir_pengeluaran',
      'kasir_pengaturan',
      'kasir_nomor_urut',
    ]) {
      localStorage.removeItem(k)
    }
    location.reload()
  }

  const ppnContoh = pengaturan.ppnAktif ? Math.round((100000 * (Number(pengaturan.ppnPersen) || 0)) / 100) : 0

  return (
    <div className="pb-32">
      <PageHeader judul="Pengaturan" sub="Toko, struk, dan pajak" />

      {/* Tampilan */}
      <div className="kartu mx-5 mt-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold">Mode Gelap</div>
          <div className="text-xs text-black/45">Nyaman dipakai di malam hari</div>
        </div>
        <button
          role="switch"
          aria-checked={gelap}
          aria-label="Mode gelap"
          onClick={gantiTema}
          className={`relative h-7 w-12 shrink-0 rounded-full transition duration-200 ${
            gelap ? 'bg-merek' : 'bg-black/20'
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
              gelap ? 'left-6' : 'left-1'
            }`}
          />
        </button>
      </div>

      {/* Pengingat */}
      <div className="kartu mx-5 mt-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold">Pengingat Harian</div>
          <div className="text-xs text-black/45">Notifikasi pengingat mencatat penjualan</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <input
            type="time"
            className="input !w-[104px] !px-2 !py-1.5 text-center text-xs"
            value={pengaturan.pengingatJam || '18:00'}
            onChange={(e) => ubahPengingat(!!pengaturan.pengingatAktif, e.target.value)}
          />
          <button
            role="switch"
            aria-checked={!!pengaturan.pengingatAktif}
            aria-label="Pengingat harian"
            onClick={() => ubahPengingat(!pengaturan.pengingatAktif, pengaturan.pengingatJam || '18:00')}
            className={`relative h-7 w-12 shrink-0 rounded-full transition duration-200 ${
              pengaturan.pengingatAktif ? 'bg-merek' : 'bg-black/20'
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
                pengaturan.pengingatAktif ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Keamanan menu */}
      <div className="kartu mx-5 mt-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold">Kunci Menu dengan PIN</div>
            <div className="text-xs text-black/45">
              {pengaturan.pinAktif
                ? pinTersimpan && !gantiBuka
                  ? 'Menu terkunci — tambah, ubah, dan hapus butuh PIN'
                  : 'Buat PIN untuk mengunci menu'
                : 'Tambah, ubah, dan hapus menu harus lewat PIN'}
            </div>
          </div>
          <button
            role="switch"
            aria-checked={!!pengaturan.pinAktif}
            aria-label="Kunci menu dengan PIN"
            onClick={saklarKunci}
            className={`relative h-7 w-12 shrink-0 rounded-full transition duration-200 ${
              pengaturan.pinAktif ? 'bg-merek' : 'bg-black/20'
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
                pengaturan.pinAktif ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {pengaturan.pinAktif && !gantiBuka && (
          <button
            onClick={() => {
              bersihkanFormPin()
              setPesanPin(null)
              setGantiBuka(true)
            }}
            className="tombol--hantu w-full !py-2.5 text-xs"
          >
            {pinTersimpan ? 'Ganti PIN' : 'Buat PIN'}
          </button>
        )}

        {pengaturan.pinAktif && gantiBuka && (
          <>
            {pinTersimpan && (
              <input
                type="password"
                inputMode="numeric"
                value={pinLama}
                onChange={(e) => {
                  setPinLama(e.target.value.replace(/\D/g, '').slice(0, 8))
                  setPesanPin(null)
                }}
                placeholder={pinTersimpan ? 'PIN lama saat ini' : ''}
                className="input"
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="password"
                inputMode="numeric"
                value={pinBaru}
                onChange={(e) => {
                  setPinBaru(e.target.value.replace(/\D/g, '').slice(0, 8))
                  setPesanPin(null)
                }}
                placeholder={pinTersimpan ? 'PIN baru' : 'Buat PIN (4–8 angka)'}
                className="input"
              />
              <input
                type="password"
                inputMode="numeric"
                value={pinUlang}
                onChange={(e) => {
                  setPinUlang(e.target.value.replace(/\D/g, '').slice(0, 8))
                  setPesanPin(null)
                }}
                placeholder="Ulangi PIN"
                className="input"
              />
            </div>
            <button onClick={simpanPin} className="tombol--utama w-full !py-2.5 text-sm">
              Simpan PIN
            </button>
          </>
        )}
        <PesanPudar pesan={pesanPin} onSelesai={() => setPesanPin(null)} />
      </div>

      {/* Matikan kunci — konfirmasi PIN */}
      <Modal open={matriMati} onClose={() => setMatriMati(false)} judul="Matikan Kunci Menu">
        <p className="text-sm text-black/55">
          Masukkan PIN saat ini untuk menonaktifkan kunci menu.
        </p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pinMati}
          onChange={(e) => setPinMati(e.target.value.replace(/\D/g, '').slice(0, 8))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') konfirmasiMatikan()
          }}
          placeholder="• • • •"
          className="input mt-3 text-center text-lg font-bold tracking-[0.5em]"
        />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => setMatriMati(false)} className="tombol--hantu w-full">
            Batal
          </button>
          <button onClick={konfirmasiMatikan} disabled={!pinMati} className="tombol--utama w-full">
            Matikan
          </button>
        </div>
      </Modal>

      {/* Profil toko */}
      <div className="kartu mx-5 mt-4 space-y-4">
        <h2 className="text-sm font-bold">Profil Toko & Struk</h2>

        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-krem-tua text-xs text-black/40">
            {pengaturan.logo ? (
              <img src={pengaturan.logo} alt="Logo toko" className="h-full w-full object-contain" />
            ) : (
              'Logo'
            )}
          </span>
          <div className="flex flex-col items-start gap-1.5">
            <label className="tombol--hantu cursor-pointer !px-3 !py-2 text-xs">
              Unggah Logo
              <input type="file" accept="image/*" className="hidden" onChange={unggahLogo} />
            </label>
            {pengaturan.logo && (
              <button
                onClick={() => ubah('logo', null)}
                className="text-left text-xs text-red-500 underline underline-offset-2"
              >
                Hapus logo
              </button>
            )}
          </div>
        </div>

        <div>
          <span className="label">Nama Toko</span>
          <input
            className="input"
            value={pengaturan.namaToko}
            onChange={(e) => ubah('namaToko', e.target.value)}
            placeholder="Nama tokomu"
          />
        </div>
        <div>
          <span className="label">Alamat</span>
          <input
            className="input"
            value={pengaturan.alamat}
            onChange={(e) => ubah('alamat', e.target.value)}
            placeholder="Alamat toko"
          />
        </div>
        <div>
          <span className="label">Telepon</span>
          <input
            className="input"
            value={pengaturan.telepon}
            onChange={(e) => ubah('telepon', e.target.value)}
            placeholder="No. telepon"
          />
        </div>
        <div>
          <span className="label">Catatan Bawah Struk</span>
          <textarea
            className="input resize-none"
            rows={2}
            value={pengaturan.catatanStruk}
            onChange={(e) => ubah('catatanStruk', e.target.value)}
            placeholder="cth. Terima kasih sudah berbelanja"
          />
        </div>
      </div>

      {/* PPN */}
      <div className="kartu mx-5 mt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold">PPN / Pajak Otomatis</div>
            <div className="text-xs text-black/45">Dihitung dari subtotal saat pembayaran</div>
          </div>
          <button
            role="switch"
            aria-checked={pengaturan.ppnAktif}
            onClick={() => ubah('ppnAktif', !pengaturan.ppnAktif)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              pengaturan.ppnAktif ? 'bg-merek' : 'bg-black/20'
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                pengaturan.ppnAktif ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {pengaturan.ppnAktif && (
          <div className="mt-4">
            <span className="label">Besaran PPN</span>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="100"
                value={pengaturan.ppnPersen}
                onChange={(e) =>
                  ubah(
                    'ppnPersen',
                    Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                  )
                }
                className="input pr-9 font-bold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-black/40">
                %
              </span>
            </div>
            <p className="mt-2 rounded-xl bg-krem-tua px-3 py-2 text-xs leading-relaxed text-black/55">
              Contoh: belanja {rupiah(100000)} → PPN {rupiah(ppnContoh)}, total{' '}
              <strong>{rupiah(100000 + ppnContoh)}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Zona data */}
      <div className="kartu mx-5 mt-4 space-y-2.5">
        <h2 className="text-sm font-bold">Kelola Data</h2>
        <button
          onClick={resetTransaksi}
          className="tombol w-full bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50 !py-2.5 text-sm"
        >
          Reset Transaksi & Pengeluaran
        </button>
        <button
          onClick={resetSemua}
          className="tombol w-full bg-red-600 !py-2.5 text-sm text-white hover:bg-red-700"
        >
          Hapus Semua Data
        </button>
      </div>

      <p className="mt-4 px-5 text-center text-[11px] text-black/35">
        Semua perubahan tersimpan otomatis di perangkat ini.
      </p>
    </div>
  )
}
