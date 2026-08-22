import { useEffect, useRef, useState } from 'react'
import { StoreProvider, useStore } from './context/StoreContext.jsx'
import { jadwalkanPengingat } from './lib/notif.js'
import { cekPembaruan } from './lib/update.js'
import { Modal } from './components/Modal.jsx'
import TabBar from './components/TabBar.jsx'
import KasirPage from './pages/KasirPage.jsx'
import MenuPage from './pages/MenuPage.jsx'
import LaporanPage from './pages/LaporanPage.jsx'
import AturPage from './pages/AturPage.jsx'

const URUTAN_TAB = ['kasir', 'menu', 'laporan', 'atur']

const barisCatatan = (teks) =>
  String(teks || '')
    .split('\n')
    .map((b) =>
      b
        .trim()
        .replace(/^#{1,6}\s*/, '')
        .replace(/^[-*]+\s*/, '')
        .replace(/\*\*/g, '')
        .replace(/`/g, ''),
    )
    .filter((b) => b && !/^(what.?s changed|full changelog)/i.test(b))

function JendelaPembaruan({ info, tutup }) {
  return (
    <Modal open={!!info} onClose={tutup} judul="Pembaruan Tersedia">
      {info && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="" className="h-14 w-14 rounded-2xl shadow-kartu" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-judul text-lg">Versi {info.versi}</span>
                <span className="chip bg-merek-lembut text-merek">Baru</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--teks)', opacity: 0.55 }}>
                Yang baru dalam versi ini:
              </p>
            </div>
          </div>
          {barisCatatan(info.catatan).length > 0 && (
            <div className="max-h-52 space-y-2 overflow-y-auto rounded-2xl bg-white p-4 shadow-kartu">
              {barisCatatan(info.catatan).map((b, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-black/60">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-merek" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          )}
          {!info.urlUnduh.includes('.apk') && (
            <p className="text-xs text-black/40">Berkas APK belum dilampirkan pada rilis ini.</p>
          )}
          <button onClick={() => window.open(info.urlUnduh, '_blank')} className="tombol--utama w-full">
            Unduh Versi Baru
          </button>
          <button onClick={tutup} className="tombol--hantu w-full">
            Nanti Saja
          </button>
        </div>
      )}
    </Modal>
  )
}

function Splash({ tutup }) {
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
      <div className="h-1 w-44 overflow-hidden rounded-full" style={{ background: 'var(--garis)' }}>
        <div className="anim-pemuat h-full w-1/2 rounded-full bg-merek" />
      </div>
    </div>
  )
}

function Halaman() {
  const { pengaturan } = useStore()
  const [tab, setTab] = useState('kasir')
  const [keKanan, setKeKanan] = useState(true)
  const [infoUpdate, setInfoUpdate] = useState(null)
  const tabSebelumnya = useRef(tab)
  const sentuh = useRef(null)

  useEffect(() => {
    jadwalkanPengingat(!!pengaturan.pengingatAktif, pengaturan.pengingatJam || '18:00')
  }, [pengaturan.pengingatAktif, pengaturan.pengingatJam])

  useEffect(() => {
    const t = setTimeout(() => {
      cekPembaruan().then(setInfoUpdate)
    }, 2500)
    return () => clearTimeout(t)
  }, [])

  const pindah = (tujuan) => {
    if (!URUTAN_TAB.includes(tujuan) || tujuan === tabSebelumnya.current) return
    setKeKanan(URUTAN_TAB.indexOf(tujuan) > URUTAN_TAB.indexOf(tabSebelumnya.current))
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
    if (!sentuh.current) return
    const dx = e.changedTouches[0].clientX - sentuh.current.x
    const dy = e.changedTouches[0].clientY - sentuh.current.y
    sentuh.current = null
    if (Math.abs(dx) < 64 || Math.abs(dy) > 56) return
    const i = URUTAN_TAB.indexOf(tabSebelumnya.current)
    const tujuan = URUTAN_TAB[Math.min(URUTAN_TAB.length - 1, Math.max(0, i + (dx < 0 ? 1 : -1)))]
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
      <TabBar tab={tab} setTab={pindah} />
      <JendelaPembaruan info={infoUpdate} tutup={() => setInfoUpdate(null)} />
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
