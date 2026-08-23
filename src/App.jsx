import { useEffect, useRef, useState } from 'react'
import { StoreProvider, useStore } from './context/StoreContext.jsx'
import { LocalNotifications } from '@capacitor/local-notifications'
import { jadwalkanPengingat } from './lib/notif.js'
import { cekPembaruan, sudahDitunda, besok, bersihkanSisa, kirimNotif, simpanCatatan, VERSI } from './lib/update.js'
import { mulaiBackgroundTask } from './lib/background.js'
import { pakaiBahasa, t } from './lib/bahasa.js'
import PembaruanModal from './components/PembaruanModal.jsx'
import CatatanRilisModal from './components/CatatanRilisModal.jsx'
import TabBar from './components/TabBar.jsx'
import Ikon from './components/Ikon.jsx'
import { Modal } from './components/Modal.jsx'
import KasirPage from './pages/KasirPage.jsx'
import MenuPage from './pages/MenuPage.jsx'
import LaporanPage from './pages/LaporanPage.jsx'
import AturPage from './pages/AturPage.jsx'

const URUTAN_TAB = ['kasir', 'menu', 'laporan', 'atur']

// Dicek di level modul — SEBELUM React menulis data awal ke localStorage.
// Ada data = aplikasi lama terpasang, jadi pemasangan baru terhitung sebagai pembaruan.
const ADA_DATA_LAMA = ['kasir_produk', 'kasir_transaksi', 'kasir_nomor_urut'].some(
  (k) => localStorage.getItem(k) !== null,
)

const ubahTunda = (setPengaturan) =>
  setPengaturan((s) => ({ ...s, tundaUpdateSampai: besok() }))

function Splash({ tutup }) {
  const [progres, setProgres] = useState(0)
  useEffect(() => {
    const mulai = Date.now()
    // Samakan dengan jadwal splash di App: fade-out mulai 1050 ms
    const durasi = 1000
    let raf
    const tick = () => {
      const berlalu = Date.now() - mulai
      setProgres(Math.min(100, Math.round((berlalu / durasi) * 100)))
      if (berlalu < durasi) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 ${
        tutup ? 'anim-padam pointer-events-none' : ''
      }`}
      style={{ background: 'var(--latar)' }}
    >
      <img src="/icon.svg" alt="" className="anim-muncul h-20 w-20 rounded-[22px] shadow-xl" />
      <div className="anim-naik text-center">
        <div className="font-judul text-3xl" style={{ color: 'var(--teks)' }}>
          Kasir Nusantara
        </div>
        <p className="mt-1 text-sm" style={{ color: 'var(--teks)', opacity: 0.55 }}>
          Kelola warungmu dengan mudah
        </p>
      </div>
      <div className="w-56 max-w-[70vw]">
        <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--garis)' }}>
          <div
            className="h-full rounded-full bg-merek transition-none"
            style={{ width: `${progres}%` }}
          />
        </div>
        <p
          className="mt-2 text-center text-xs font-semibold"
          style={{ color: 'var(--teks)', opacity: 0.45 }}
        >
          {progres}%
        </p>
      </div>
    </div>
  )
}

function Halaman() {
  const { pengaturan, setPengaturan } = useStore()
  pakaiBahasa()
  const [tab, setTab] = useState('kasir')
  const [keKanan, setKeKanan] = useState(true)
  const [infoUpdate, setInfoUpdate] = useState(null)
  const [rilisBaru, setRilisBaru] = useState(false)
  // Mode Lite
  const [mintaKeluar, setMintaKeluar] = useState(false)
  const [pinKeluar, setPinKeluar] = useState('')
  const [salahKeluar, setSalahKeluar] = useState(false)
  const tabSebelumnya = useRef(tab)
  const sentuh = useRef(null)
  const pengaturanRef = useRef(pengaturan)
  pengaturanRef.current = pengaturan
  const modeLite = !!pengaturan.modeLite
  const urutanTab = modeLite ? ['kasir'] : URUTAN_TAB

  useEffect(() => {
    jadwalkanPengingat(!!pengaturan.pengingatAktif, pengaturan.pengingatJam || '18:00')
  }, [pengaturan.pengingatAktif, pengaturan.pengingatJam])

  const prosesInfoRilis = (info) => {
    if (!info) return
    simpanCatatan(info.versi, info.catatan)
    if (!sudahDitunda(pengaturanRef.current)) {
      kirimNotif(info)
      setInfoUpdate(info)
    }
  }

  useEffect(() => {
    bersihkanSisa()
    // Popup catatan rilis: hanya sekali, tepat setelah aplikasi diperbarui
    const versiTercatat = localStorage.getItem('kasir_versi_terakhir')
    if (versiTercatat !== VERSI) {
      localStorage.setItem('kasir_versi_terakhir', VERSI)
      if (versiTercatat || ADA_DATA_LAMA) setRilisBaru(true)
    }
    localStorage.setItem('kasir_cek_terakhir', String(Date.now()))
    const t = setTimeout(() => cekPembaruan().then(prosesInfoRilis), 2500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Aplikasi sering tertahan di memori: cek ulang tiap kembali ke layar (maks 1x/15 menit)
  useEffect(() => {
    const periksaLagi = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - Number(localStorage.getItem('kasir_cek_terakhir') || 0) < 900000) return
      localStorage.setItem('kasir_cek_terakhir', String(Date.now()))
      cekPembaruan().then(prosesInfoRilis)
    }
    document.addEventListener('visibilitychange', periksaLagi)
    return () => document.removeEventListener('visibilitychange', periksaLagi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Polling berkala selama aplikasi terbuka — notifikasi secepat mungkin tanpa server push
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      cekPembaruan().then(prosesInfoRilis)
    }, 600000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Background task: cek update di latar belakang
  useEffect(() => {
    mulaiBackgroundTask()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Ketuk notifikasi → langsung buka modal pembaruan (lewati tundaan)
  useEffect(() => {
    let pegangan = null
    LocalNotifications.addListener('localNotificationActionPerformed', () => {
      cekPembaruan().then((info) => {
        if (!info) return
        simpanCatatan(info.versi, info.catatan)
        setInfoUpdate(info)
      })
    }).then((h) => {
      pegangan = h
    })
    return () => pegangan?.remove?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const keluarLite = () => {
    if (pinKeluar !== (pengaturan.pinKode || '')) {
      setSalahKeluar(true)
      return
    }
    setPengaturan((s) => ({ ...s, modeLite: false }))
    setTab('kasir')
    tabSebelumnya.current = 'kasir'
    setMintaKeluar(false)
    setPinKeluar('')
    setSalahKeluar(false)
  }

  const pindah = (tujuan) => {
    if (!urutanTab.includes(tujuan) || tujuan === tabSebelumnya.current) return
    setKeKanan(urutanTab.indexOf(tujuan) > urutanTab.indexOf(tabSebelumnya.current))
    tabSebelumnya.current = tujuan
    setTab(tujuan)
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    const bukaTab = (e) => pindah(e.detail)
    window.addEventListener('kasir:buka-tab', bukaTab)
    return () => window.removeEventListener('kasir:buka-tab', bukaTab)
  })

  const mulaiSentuh = (e) => {
    if (e.target.closest?.('.no-scrollbar')) {
      sentuh.current = null
      return
    }
    sentuh.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const akhirSentuh = (e) => {
    if (!sentuh.current || modeLite) return
    const dx = e.changedTouches[0].clientX - sentuh.current.x
    const dy = e.changedTouches[0].clientY - sentuh.current.y
    sentuh.current = null
    if (Math.abs(dx) < 64 || Math.abs(dy) > 56) return
    const i = urutanTab.indexOf(tabSebelumnya.current)
    const tujuan =
      urutanTab[Math.min(urutanTab.length - 1, Math.max(0, i + (dx < 0 ? 1 : -1)))]
    pindah(tujuan)
  }

  return (
    <>
      <div
        key={tab}
        className={`min-h-screen ${keKanan ? 'anim-dari-kanan' : 'anim-dari-kiri'}`}
        onTouchStart={mulaiSentuh}
        onTouchEnd={akhirSentuh}
      >
        {tab === 'kasir' && <KasirPage />}
        {tab === 'menu' && <MenuPage />}
        {tab === 'laporan' && <LaporanPage />}
        {tab === 'atur' && <AturPage />}
      </div>
      {modeLite ? (
        <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))] layar:pb-6">
          <button
            onClick={() => setMintaKeluar(true)}
            className="bilah-kaca pointer-events-auto flex items-center gap-2 rounded-full px-6 py-3 text-xs font-bold shadow-lg transition active:scale-95"
            style={{ color: 'var(--teks)' }}
          >
            <Ikon nama="kunci" className="h-4 w-4" />
            {t('Keluar Mode Lite')}
          </button>
        </nav>
      ) : (
        <TabBar tab={tab} setTab={pindah} />
      )}
      <Modal
        open={mintaKeluar}
        onClose={() => {
          setMintaKeluar(false)
          setPinKeluar('')
          setSalahKeluar(false)
        }}
        judul={t('Keluar Mode Lite')}
      >
        <p className="text-sm text-black/55">{t('Masukkan PIN untuk kembali ke mode lengkap.')}</p>
        <input
          type="password"
          inputMode="numeric"
          value={pinKeluar}
          onChange={(e) => {
            setPinKeluar(e.target.value.replace(/\D/g, '').slice(0, 8))
            setSalahKeluar(false)
          }}
          className="input mt-2 text-center tracking-[0.4em]"
          placeholder="••••"
        />
        {salahKeluar && (
          <p className="mt-2 text-center text-xs font-semibold text-red-500">
            {t('PIN salah. Coba lagi.')}
          </p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setMintaKeluar(false)
              setPinKeluar('')
              setSalahKeluar(false)
            }}
            className="tombol--hantu w-full"
          >
            {t('Batal')}
          </button>
          <button onClick={keluarLite} disabled={!pinKeluar} className="tombol--utama w-full">
            {t('Buka')}
          </button>
        </div>
      </Modal>
      <CatatanRilisModal buka={rilisBaru} tutup={() => setRilisBaru(false)} />
      <PembaruanModal
        info={infoUpdate}
        tutup={() => {
          if (infoUpdate) ubahTunda(setPengaturan)
          setInfoUpdate(null)
        }}
      />
    </>
  )
}

export default function App() {
  const [splashTampil, setSplashTampil] = useState(true)
  const [splashTutup, setSplashTutup] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setSplashTutup(true), 1050)
    const t2 = setTimeout(() => setSplashTampil(false), 1600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <StoreProvider>
      {splashTampil && <Splash tutup={splashTutup} />}
      <div className="panggung">
        <Halaman />
      </div>
    </StoreProvider>
  )
}
