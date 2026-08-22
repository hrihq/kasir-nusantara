# Kasir Nusantara

Aplikasi kasir (POS) Android berbasis Vite + React + Tailwind + Capacitor.

---

## Cara Rilis Update (otomatis lewat GitHub Actions)

Aplikasi mengecek **GitHub Releases** setiap kali dibuka. Jika ada versi lebih baru dari `version` di `package.json`, muncul jendela "Pembaruan Tersedia" berisi catatan rilis (changelog) + tombol unduh APK.

Workflow `.github/workflows/release.yml` berjalan setiap push ke `main`: jika versi `package.json` belum punya Release, ia otomatis **membangun APK, membuat Release, dan melampirkan APK** dengan changelog dari daftar commit sejak tag sebelumnya (`--generate-notes`).

### Alur update (cukup ini saja)

```
# 1. ubah kode seperti biasa, commit
git add -A && git commit -m "fitur baru"

# 2. naikkan versi (patch = 1.0.1, minor = 1.1.0, major = 2.0.0)
npm version minor

# 3. dorong ke GitHub — sisanya otomatis
git push --follow-tags
```

Beberapa menit kemudian Release baru muncul di GitHub berisi APK, dan pengguna mendapat notifikasi pembaruan beserta changelog saat membuka aplikasi. Changelog bisa kamu rapikan manual kapan saja di halaman Releases (tombol edit).

Catatan: notifikasi muncul saat aplikasi dibuka (bukan dorongan server). Tanpa internet, pemeriksaan diabaikan secara diam-diam.

---

## Spesifikasi Navbar "Pill" (untuk direplikasi AI di aplikasi lain)

Navbar berbentuk **pill melayang** dengan kapsul indikator aktif yang meluncur, dukungan **geser-tekan-lepas** ala iPhone, dan dua tata letak: bawah-tengah (tegak) & rel kanan berdiri (landscape). Ikuti spesifikasi ini secara persis.

### 1. Struktur

```jsx
<nav>            // pembungkus posisi (pointer-events-none)
  <div>          // PIL: wadah pill (pointer-events-auto, ref untuk ukur)
    <span />     // KAPSUL: indikator aktif (absolute, di belakang tombol)
    <button data-tab="..." /> ×4   // tombol tab (relative z-1, ref per tab)
  </div>
</nav>
```

### 2. Posisi & Ukuran

| Aspek | Mode tegak (portrait) | Mode mendatar (landscape) |
|---|---|---|
| Posisi nav | `fixed inset-x-0 bottom-0` tengah | `fixed right` vertikal tengah: `right-[max(1rem,env(safe-area-inset-right))] top-1/2 -translate-y-1/2` |
| Jarak tepi | `pb-[max(1rem,env(safe-area-inset-bottom))]` | `pb-0` |
| Arah susunan | baris (`flex items-center gap-1`) | kolom (`flex-col`) |
| Lebar pill | `w-[calc(100vw-2.5rem)] max-w-[380px]` | `w-auto` (mengikuti isi) |
| Sudut | `rounded-full` | `rounded-[22px]` (lebih mengotak) |
| Isi tombol | **sama persis kedua orientasi** — jangan ubah ukuran tombol saat landscape | idem |

Umum: `z-40`, nav `pointer-events-none`, pill `pointer-events-auto`.

### 3. Tampilan Pill

```
p-1.5  shadow-kartu  ring-1 ring-black/10  backdrop-blur-xl
background-color: var(--permukaan)   // ikut tema terang/gelap via CSS variable
ring color      : var(--garis)
```

- **Kapsul aktif**: `absolute rounded-full bg-merek shadow-md transition-all duration-300 ease-out`
  - Posisinya BUKAN lewat class — dihitung: ambil `getBoundingClientRect()` tombol aktif dikurangi `getBoundingClientRect()` pill → simpan `{left, top, width, height}` ke state, terapkan sebagai inline `style`.
  - Ukur dengan `useLayoutEffect` setiap kali tab target berubah + pasang listener `resize`.
  - Hanya kapsul yang meluncur — **pill tidak bergeser sedikit pun**.
- **Tombol**: `flex-1 py-2.5 text-xs font-semibold gap-1.5 rounded-full transition-colors duration-200 active:scale-95`
  - Ikon 18×18px + label teks.
  - Aktif: warna putih. Nonaktif: `color: var(--teks)` dengan `opacity .55`.
  - `z-[1]` supaya di atas kapsul.
- 4 tab contoh: Kasir, Menu, Laporan, Atur (ikon: keranjang, kotak, grafik, atur).

### 4. Interaksi (WAJIB — ini pembeda utamanya)

Tiga cara pindah tab:

1. **Ketuk** langsung → pindah instan (`onClick`).
2. **Tekan–geser–lepas** ala iPhone:
   - `onTouchStart`: sorot tab hasil **proyeksi posisi jari** (lihat bawah).
   - `onTouchMove`: perbarui sorotan mengikuti jari.
   - `onTouchEnd`: pindah ke tab yang disorot saat jari dilepas. Jika sorotan = tab awal, pakai fallback arah sentakan.
3. **Sentakan cepat (flick)** tanpa menggeser jauh: perpindahan dominan ≥ **48px** → pindah 1 tab searah.

**Proyeksi sumbu** (kunci responsivitas — jari BOLEH keluar dari pill):

```js
function proyeksiIdx(x, y) {
  const r = pill.getBoundingClientRect()
  const vertikal = r.height > r.width        // landscape rel = sumbu Y
  const f = vertikal ? (y - r.top) / r.height : (x - r.left) / r.width
  const i = Math.floor(f * JUMLAH_TAB)
  return Math.min(JUMLAH_TAB - 1, Math.max(0, i))
}
```

- Jari melenceng ke luar pill tetap terpetakan ke tab terdekat (dibatasi 0…n-1).
- Saat commit lewat geser: `e.preventDefault()` agar tidak memicu klik hantu.
- `onTouchCancel`: reset sorotan saja.

### 5. Halaman

Transisi antar halaman cukup fade opasitas 200ms (`animation: masuk-halaman`). JANGAN animasikan transform pada halaman — elemen `fixed` di dalamnya akan ikut bergeser. Bonus: halaman bisa ditambahkan gestur swipe kiri/kanan untuk ganti tab (sinkron dengan arah urutan tab).

### 6. Tema

Warna pill wajib lewat CSS variable (`--permukaan`, `--garis`, `--teks`) yang didefinisikan di `:root` dan dioverride `.dark`, sehingga navbar otomatis ikut mode gelap tanpa logika tambahan di komponen.
