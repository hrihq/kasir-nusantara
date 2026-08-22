import { useEffect, useMemo, useRef, useState } from 'react'
import Chart from 'chart.js/auto'
import { useStore } from '../context/StoreContext.jsx'
import { rupiah, kunciHari, tanggalPendek, tanggalLengkap } from '../lib/format.js'
import { pakaiTema } from '../lib/tema.js'
import { t, lokale } from '../lib/bahasa.js'
import { eksporExcel, namaBerkasLaporan } from '../lib/ekspor.js'
import PageHeader from '../components/PageHeader.jsx'
import Ikon from '../components/Ikon.jsx'
import PesanPudar from '../components/PesanPudar.jsx'
import { StrukModal } from '../components/StrukModal.jsx'

function rentang(n) {
  const out = []
  const kini = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(kini.getFullYear(), kini.getMonth(), kini.getDate() - i)
    out.push({
      kunci: kunciHari(d),
      label: d.toLocaleDateString(lokale(), { day: 'numeric', month: 'short' }),
    })
  }
  return out
}

const opsiUmum = (gelap) => {
  const warnaTick = gelap ? 'rgba(244,238,230,.55)' : 'rgba(36,21,7,.55)'
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (c) => ` ${c.dataset.label}: ${rupiah(c.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: warnaTick,
          callback: (v) => (v >= 1000000 ? `${v / 1000000}jt` : v >= 1000 ? `${v / 1000}rb` : v),
        },
        grid: { color: gelap ? 'rgba(244,238,230,.07)' : 'rgba(36,21,7,.06)' },
      },
      x: {
        grid: { display: false },
        ticks: { maxRotation: 0, autoSkip: true, color: warnaTick },
      },
    },
  }
}

function GrafikGaris({ labels, data, gelap }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const ch = new Chart(ref.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: t('Pemasukan'),
            data,
            borderColor: '#b23b22',
            backgroundColor: 'rgba(178,59,34,.10)',
            fill: true,
            tension: 0.38,
            pointRadius: 3,
            pointBackgroundColor: '#b23b22',
            borderWidth: 2.5,
          },
        ],
      },
      options: opsiUmum(gelap),
    })
    return () => ch.destroy()
  }, [labels, data, gelap])
  return (
    <div className="relative h-52">
      <canvas ref={ref} />
    </div>
  )
}

function GrafikBatang({ labels, omzet, beban, gelap }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const dasar = opsiUmum(gelap)
    const ch = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: t('Pemasukan'),
            data: omzet,
            backgroundColor: '#b23b22',
            borderRadius: 6,
            maxBarThickness: 16,
          },
          {
            label: t('Pengeluaran'),
            data: beban,
            backgroundColor: gelap ? '#a08672' : '#7a5c49',
            borderRadius: 6,
            maxBarThickness: 16,
          },
        ],
      },
      options: {
        ...dasar,
        plugins: {
          ...dasar.plugins,
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              borderRadius: 5,
              usePointStyle: true,
              color: gelap ? 'rgba(244,238,230,.65)' : 'rgba(36,21,7,.6)',
            },
          },
        },
      },
    })
    return () => ch.destroy()
  }, [labels, omzet, beban, gelap])
  return (
    <div className="relative h-52">
      <canvas ref={ref} />
    </div>
  )
}

function KartuStat({ label, nilai, warna, garis }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-4 pl-5 shadow-kartu">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${garis || 'bg-merek'}`} />
      <div className="text-[11px] font-bold uppercase tracking-wide text-black/45">{label}</div>
      <div className={`mt-1 truncate text-lg font-extrabold ${warna || ''}`}>{nilai}</div>
    </div>
  )
}

export default function LaporanPage() {
  const { transaksi, pengeluaran, setPengeluaran, pengaturan } = useStore()
  const [gelap] = pakaiTema()
  const [periode, setPeriode] = useState(7)
  const [pilih, setPilih] = useState(null)

  const hari = useMemo(() => rentang(periode), [periode])
  const hari7 = useMemo(() => rentang(7), [])

  const omzetMap = useMemo(() => {
    const m = {}
    for (const t of transaksi) {
      const k = kunciHari(new Date(t.tanggal))
      m[k] = (m[k] || 0) + t.total
    }
    return m
  }, [transaksi])

  const bebanMap = useMemo(() => {
    const m = {}
    for (const e of pengeluaran) {
      const k = kunciHari(new Date(e.tanggal))
      m[k] = (m[k] || 0) + e.jumlah
    }
    return m
  }, [pengeluaran])

  const labelsPeriode = useMemo(() => hari.map((h) => h.label), [hari])
  const deretOmzet = useMemo(() => hari.map((h) => omzetMap[h.kunci] || 0), [hari, omzetMap])
  const deretBeban = useMemo(() => hari.map((h) => bebanMap[h.kunci] || 0), [hari, bebanMap])

  const omzet = deretOmzet.reduce((a, b) => a + b, 0)
  const beban = deretBeban.reduce((a, b) => a + b, 0)
  const laba = omzet - beban
  const hariSet = useMemo(() => new Set(hari.map((h) => h.kunci)), [hari])
  const jmlTrx = useMemo(
    () => transaksi.filter((t) => hariSet.has(kunciHari(new Date(t.tanggal)))).length,
    [hariSet, transaksi],
  )

  // Form pengeluaran
  const [fJudul, setFJudul] = useState('')
  const [fJumlah, setFJumlah] = useState('')
  const [fTanggal, setFTanggal] = useState(() => kunciHari(new Date()))
  const [pesanBeban, setPesanBeban] = useState(null)
  const [pesanExcel, setPesanExcel] = useState(null)

  const simpanBeban = () => {
    const judul = fJudul.trim()
    const jumlah = Math.round(Number(fJumlah))
    if (!judul || !(jumlah > 0)) return
    setPengeluaran((p) => [
      { id: `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, judul, jumlah, tanggal: new Date(`${fTanggal}T12:00:00`).toISOString() },
      ...p,
    ])
    setFJudul('')
    setFJumlah('')
    setPesanBeban({ ok: true, teks: t('Pengeluaran tersimpan.') })
  }

  const hapusBeban = (e) => {
    if (!confirm(`${t('Hapus')} "${e.judul}"?`)) return
    setPengeluaran((p) => p.filter((x) => x.id !== e.id))
  }

  const unduhExcel = async () => {
    try {
      await eksporExcel({
        transaksi: transaksi.filter((t) => hariSet.has(kunciHari(new Date(t.tanggal)))),
        pengeluaran: pengeluaran.filter((x) => hariSet.has(kunciHari(new Date(x.tanggal)))),
        hari,
        namaFile: namaBerkasLaporan(),
      })
      setPesanExcel({ ok: true, teks: t('Laporan Excel tersimpan.') })
    } catch {
      setPesanExcel({ ok: false, teks: t('Gagal membuat laporan Excel.') })
    }
  }
  return (
    <div className="pb-32">
      <PageHeader judul={t('Laporan')} sub={t('Performa penjualan & arus kas')} />

      {/* Pilihan periode */}
      <div className="flex items-center gap-2 px-5 pb-3">
        {[7, 30].map((n) => (
          <button
            key={n}
            onClick={() => setPeriode(n)}
            className={`chip ${periode === n ? 'bg-merek text-white' : 'bg-white text-black/60 ring-1 ring-black/10'}`}
          >
            {t('%s Hari Terakhir').replace('%s', n)}
          </button>
        ))}
        <button
          onClick={unduhExcel}
          className="chip ml-auto flex items-center gap-1.5 bg-white text-black/60 ring-1 ring-black/10"
        >
          <Ikon nama="unduh" className="h-4 w-4" />
          Excel
        </button>
      </div>
      <PesanPudar pesan={pesanExcel} onSelesai={() => setPesanExcel(null)} />

      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3 px-5 layar:grid-cols-4">
        <KartuStat label={`${t('Omzet')} ${periode} ${t('hari')}`} nilai={rupiah(omzet)} warna="text-merek" garis="bg-merek" />
        <KartuStat label={t('Transaksi')} nilai={`${jmlTrx} ${t('order')}`} garis="bg-amber-400" />
        <KartuStat label={t('Pengeluaran')} nilai={rupiah(beban)} garis="bg-[#7a5c49]" />
        <KartuStat
          label={t('Laba Bersih')}
          nilai={rupiah(laba)}
          warna={laba >= 0 ? 'text-emerald-600' : 'text-red-500'}
          garis={laba >= 0 ? 'bg-emerald-500' : 'bg-red-400'}
        />
      </div>

      {/* Grafik garis */}
      <div className="kartu mx-5 mt-4">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-bold">{t('Grafik Pemasukan')}</h2>
          <span className="text-xs text-black/45">{rupiah(omzet)}</span>
        </div>
        <GrafikGaris labels={labelsPeriode} data={deretOmzet} gelap={gelap} />
      </div>

      {/* Grafik batang */}
      <div className="kartu mx-5 mt-4">
        <h2 className="mb-2 text-sm font-bold">{t('Pemasukan vs Pengeluaran (7 Hari)')}</h2>
        <GrafikBatang
          labels={hari7.map((h) => h.label)}
          omzet={hari7.map((h) => omzetMap[h.kunci] || 0)}
          beban={hari7.map((h) => bebanMap[h.kunci] || 0)}
          gelap={gelap}
        />
      </div>

      {/* Catat pengeluaran */}
      <div className="kartu mx-5 mt-4">
        <h2 className="mb-3 text-sm font-bold">{t('Catat Pengeluaran')}</h2>
        <div className="space-y-2.5">
          <input
            className="input"
            value={fJudul}
            onChange={(e) => setFJudul(e.target.value)}
            placeholder={t('cth. Belanja bahan dapur')}
          />
          <div className="flex gap-2">
            <input
              className="input flex-1"
              type="number"
              inputMode="numeric"
              min="0"
              value={fJumlah}
              onChange={(e) => setFJumlah(e.target.value)}
              placeholder={t('Jumlah (Rp)')}
            />
            <input
              className="input w-[38%]"
              type="date"
              value={fTanggal}
              max={kunciHari(new Date())}
              onChange={(e) => setFTanggal(e.target.value)}
            />
          </div>
          <button onClick={simpanBeban} disabled={!fJudul.trim() || !(Number(fJumlah) > 0)} className="tombol--utama w-full !py-2.5 text-sm">
            {t('Simpan Pengeluaran')}
          </button>
          <PesanPudar pesan={pesanBeban} onSelesai={() => setPesanBeban(null)} />
        </div>

        {pengeluaran.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-dashed border-black/10 pt-3">
            {pengeluaran.slice(0, 6).map((e) => (
              <li key={e.id} className="flex items-center gap-3 text-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-krem-tua">
                  <Ikon nama="minus" className="h-3.5 w-3.5 text-black/50" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{e.judul}</div>
                  <div className="text-xs text-black/45">{tanggalPendek(e.tanggal)}</div>
                </div>
                <div className="font-bold text-black/70">-{rupiah(e.jumlah)}</div>
                <button
                  onClick={() => hapusBeban(e)}
                  className="rounded-full p-1.5 text-red-400 transition hover:bg-red-50"
                  aria-label={t('Hapus pengeluaran')}
                >
                  <Ikon nama="hapus" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Riwayat transaksi */}
      <div className="kartu mx-5 mt-4">
        <h2 className="mb-3 text-sm font-bold">{t('Riwayat Transaksi')}</h2>
        {transaksi.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-black/35">
            <Ikon nama="keranjang" className="h-8 w-8" />
            <p className="text-sm">{t('Belum ada transaksi.')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-dashed divide-black/10">
            {transaksi.slice(0, 25).map((trx) => (
              <li key={trx.id}>
                <button
                  onClick={() => setPilih(trx)}
                  className="flex w-full items-center gap-3 py-2.5 text-left transition active:bg-krem-tua/60"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-merek-lembut text-merek">
                    <Ikon nama="keranjang" className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{trx.no}</div>
                    <div className="text-xs text-black/45">
                      {tanggalLengkap(trx.tanggal)} · {t(trx.metode)}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-merek">{rupiah(trx.total)}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <StrukModal trx={pilih} pengaturan={pengaturan} onClose={() => setPilih(null)} />
    </div>
  )
}
