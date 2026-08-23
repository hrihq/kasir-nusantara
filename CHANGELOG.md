# Changelog

Semua perubahan penting aplikasi Kasir Nusantara dicatat di sini.
Saat rilis, bagian versi teratas otomatis dipakai sebagai catatan rilis di GitHub
dan ditampilkan sebagai changelog di dalam aplikasi.

## 1.0.21

- Manajemen diskon: persen/nominal, berlaku untuk semua item, per kategori, atau per produk, minimal pembelian
- Manajemen member/pelanggan: daftar member, diskon per member, histori belanja
- Shift kasir: buka/tutup shift, saldo awal/akhir, cek selisih, riwayat shift
- Stok produk: field stok & minimum, badge warna di kartu kasir, otomatis berkurang saat jual
- Indikator koneksi online/offline di halaman kasir
- Struk cetak kini generate PDF + bagikan langsung lewat Android share sheet
- Ekspor Excel diperbaiki: format tabel, binary write, MIME type benar
- Scanner barcode diganti: tanpa dependency native (ML Kit), APK turun dari 27 MB ke 5 MB
- Tombol pindai di menu langsung isi kode barcode (tidak perlu ketik manual)
- Upload gambar QRIS & logo diperbaiki (FileReader, kompatibel WebView Android)

## 1.0.20

- Cetak struk langsung ke printer thermal Bluetooth (EPPOS, Codesoft, Xprinter, dll) — sambungkan di Pengaturan, uji cetak, lalu cetak tiap selesai transaksi
- Pindai barcode lewat kamera: ketuk ikon pemindai di halaman Kasir, barang dengan kode yang cocok langsung masuk keranjang
- Kode barcode bisa diisi saat menambah/mengedit menu
- Data kini dicerminkan otomatis ke folder Documents — tetap ada meski aplikasi dibersihkan sistem, dipulihkan sendiri saat aplikasi dibuka
- Terasa makin native: zoom cubit dimatikan, pull-to-refresh & efek bounce browser dimatikan
- Splash screen kini punya progress bar persen

## 1.0.19

- Tema Batik dihapus karena bermasalah — kembali ke Klasik, Laut, Rimba
- Kolom menu 3–4 kini rapat & rapi di layar sempit (teks dan tombol ikut menyesuaikan)
- Perbaikan overlay ganti tema yang tadinya tampil gelap tanpa progress bar
- Efek liquid glass diperhalus

## 1.0.18

- QRIS dipindah ke Pengaturan & terkunci PIN — tidak mudah diganti orang
- Ikon gembok baru menggantikan emoji di Mode Lite
- Keranjang tidak lagi tertutup bilah Mode Lite
- Pil tab kini liquid glass sungguhan: kilau tepi lensa, bukan sekadar frosted blur
- Motif batik tampil penuh memenuhi latar (tidak lagi kotak-kotak)
- Transisi tema: progress bar fade in di tengah layar & fade out saat selesai

## 1.0.17

- Motif batik kini menyatu penuh dengan latar (tidak lagi tampak kotak-kotak)
- Pil tab aktif jadi liquid glass — navbar lebih transparan dan lentur
- Mode Lite langsung aktif tanpa perlu menutup aplikasi
- Notifikasi pembaruan tampil sebagai banner heads-up + ketuk untuk langsung buka pembaruan
- Pemeriksaan pembaruan makin sering: tiap 10 menit selama aplikasi terbuka & tiap kembali ke layar

## 1.0.16

- Changelog kini tampil saat pembaruan tersedia & setelah aplikasi diperbarui
- Kolom menu kasir bisa diatur sendiri: 2, 3, atau 4 kolom
- Filter kategori dibuat lebih besar agar mudah disentuh
- Tema Batik memakai motif parang asli dari internet (CC0)
- Cadangan langsung tersimpan ke folder Documents di HP
- Mode Lite: hanya kasir & pembayaran, keluar wajib PIN
- Transisi tema: progress bar dengan emoji senyum bergerak, selalu di tengah layar
- Cek pembaruan diulang otomatis tiap kembali ke aplikasi + jalur cadangan bila API GitHub terblokir

## 1.0.15

- Progres unduhan tidak mundur lagi + indikator jalur & jaringan lambat
- Popup changelog pasti muncul sekali setelah update
- Menu landscape jadi 6 kolom agar muat lebih banyak
- Tema warna baru: Klasik, Batik, Laut, Rimba
- Tombol gelap/terang lebih responsif
- Skala UI menyesuaikan DPI/ukuran layar

## 1.0.14

- Notifikasi pembaruan & popup catatan rilis sekali pasca-update
- Navbar liquid glass ala iPhone
