import { useEffect, useState } from 'react'

const KUNCI_SIMPAN = 'kasir_bahasa'

// 'sistem' | 'id' | 'en'
let bahasaAktif = localStorage.getItem(KUNCI_SIMPAN) || 'sistem'

const pemilihSistem = () =>
  (navigator.language || 'id').toLowerCase().startsWith('id') ? 'id' : 'en'

const bahasaEfektif = () => (bahasaAktif === 'sistem' ? pemilihSistem() : bahasaAktif)

const EN = {
  // Tab & umum
  Kasir: 'Cashier',
  Menu: 'Menu',
  Laporan: 'Reports',
  Atur: 'Settings',
  Batal: 'Cancel',
  Buka: 'Unlock',
  Selesai: 'Done',
  Cetak: 'Print',
  Matikan: 'Turn Off',
  Tutup: 'Close',
  Tambah: 'Add',
  Semua: 'All',
  Total: 'Total',
  Subtotal: 'Subtotal',
  Tunai: 'Cash',
  QRIS: 'QRIS',

  // Kasir
  'Kasir siap melayani': 'Ready to serve',
  'Mode terang': 'Light mode',
  'Mode gelap': 'Dark mode',
  'Cari menu…': 'Search menu…',
  'Menu masih kosong': 'Menu is still empty',
  'Tambahkan menu pertamamu untuk mulai berjualan.':
    'Add your first item to start selling.',
  'Tambah Menu Pertama': 'Add First Item',
  'Menu tidak ditemukan.': 'No items found.',
  Keranjang: 'Cart',
  'Belum ada item.': 'No items yet.',
  'Bayar Sekarang': 'Pay Now',
  Pembayaran: 'Payment',
  'Total Tagihan': 'Total Due',
  'Metode Pembayaran': 'Payment Method',
  'Uang Diterima': 'Cash Received',
  'Uang Pas': 'Exact Amount',
  Kembalian: 'Change',
  Kurang: 'Short',
  'Ganti QRIS': 'Change QRIS',
  'Tambahkan QRIS': 'Add QRIS',
  'Ambil foto atau pilih gambar kode QRIS-mu':
    'Take a photo or choose your QRIS image',
  'Selesaikan Transaksi': 'Complete Transaction',
  'QRIS tersimpan.': 'QRIS saved.',
  'Gagal membaca gambar.': 'Failed to read image.',
  Jumlah: 'Qty',
  Kurangi: 'Decrease',
  'Tunai dibulatkan jadi %s': 'Cash rounded up to %s',
  PPN: 'VAT',

  // Kelola menu
  'Kelola Menu': 'Manage Menu',
  'menu tersedia': 'items available',
  'Edit Menu': 'Edit Item',
  'Tambah Menu': 'Add Item',
  'Foto Menu': 'Item Photo',
  'Ganti Foto': 'Change Photo',
  'Unggah Foto': 'Upload Photo',
  'Hapus foto': 'Remove photo',
  'JPG/PNG — otomatis dikompres agar hemat penyimpanan.':
    'JPG/PNG — compressed automatically to save storage.',
  'Nama Menu': 'Item Name',
  'cth. Ayam Bakar Madu': 'e.g. Honey Grilled Chicken',
  'Harga (Rp)': 'Price (Rp)',
  Kategori: 'Category',
  'Pilih kategori…': 'Choose category…',
  '+ Kategori Baru': '+ New Category',
  'Nama kategori baru': 'New category name',
  'Simpan Perubahan': 'Save Changes',
  'Tambah ke Menu': 'Add to Menu',
  'Masukkan PIN': 'Enter PIN',
  'Masukkan PIN pengelola menu untuk melanjutkan.':
    'Enter your manager PIN to continue.',
  'PIN salah. Coba lagi.': 'Wrong PIN. Try again.',
  Edit: 'Edit',
  Hapus: 'Delete',

  // Laporan
  'Performa penjualan & arus kas': 'Sales performance & cash flow',
  '%s Hari Terakhir': 'Last %s Days',
  'Belum ada menu. Ketuk “Tambah” untuk membuat menu pertama.':
    'No items yet. Tap “Add” to create your first item.',
  'Hari Terakhir': 'Last Days',
  Excel: 'Excel',
  Omzet: 'Revenue',
  Transaksi: 'Transactions',
  order: 'orders',
  Pengeluaran: 'Expenses',
  'Laba Bersih': 'Net Profit',
  'Grafik Pemasukan': 'Revenue Chart',
  'Pemasukan vs Pengeluaran (7 Hari)': 'Income vs Expenses (7 Days)',
  Pemasukan: 'Income',
  'Catat Pengeluaran': 'Record Expense',
  'cth. Belanja bahan dapur': 'e.g. Kitchen supplies',
  'Jumlah (Rp)': 'Amount (Rp)',
  'Simpan Pengeluaran': 'Save Expense',
  'Pengeluaran tersimpan.': 'Expense saved.',
  'Laporan Excel tersimpan.': 'Excel report saved.',
  'Gagal membuat laporan Excel.': 'Failed to create Excel report.',
  'Riwayat Transaksi': 'Transaction History',
  'Belum ada transaksi.': 'No transactions yet.',
  hari: 'days',

  // Atur
  Pengaturan: 'Settings',
  'Toko, struk, dan pajak': 'Store, receipts, and tax',
  Tema: 'Theme',
  'Mengikuti tampilan HP-mu': 'Follows your phone',
  'Selalu gelap': 'Always dark',
  'Selalu terang': 'Always light',
  Sistem: 'System',
  Gelap: 'Dark',
  Terang: 'Light',
  Bahasa: 'Language',
  'Ikuti bahasa HP-mu': 'Follows your phone language',
  'Ikuti Sistem': 'System',
  Indonesia: 'Indonesia',
  English: 'English',
  'Pengingat Harian': 'Daily Reminder',
  'Notifikasi pengingat mencatat penjualan':
    'A notification reminding you to record sales',
  'Kunci Menu dengan PIN': 'Lock Menu with PIN',
  'Menu terkunci — tambah, ubah, dan hapus butuh PIN':
    'Menu locked — add, edit, and delete require PIN',
  'Buat PIN untuk mengunci menu': 'Create a PIN to lock the menu',
  'Tambah, ubah, dan hapus menu harus lewat PIN':
    'Adding, editing, and deleting menu requires PIN',
  'Ganti PIN': 'Change PIN',
  'Buat PIN': 'Create PIN',
  'PIN lama saat ini': 'Current PIN',
  'PIN baru': 'New PIN',
  'Buat PIN (4–8 angka)': 'Create PIN (4–8 digits)',
  'Ulangi PIN': 'Repeat PIN',
  'Simpan PIN': 'Save PIN',
  'PIN lama salah.': 'Old PIN is wrong.',
  'PIN harus 4–8 angka.': 'PIN must be 4–8 digits.',
  'Ketikan ulang PIN belum sama.': 'PIN repeat does not match.',
  'PIN berhasil diganti.': 'PIN changed successfully.',
  'PIN aktif. Menu terkunci.': 'PIN active. Menu locked.',
  'Kunci menu dimatikan.': 'Menu lock turned off.',
  'PIN lama salah. Kunci tetap menyala.': 'Old PIN is wrong. Lock stays on.',
  'Matikan Kunci Menu': 'Turn Off Menu Lock',
  'Masukkan PIN saat ini untuk menonaktifkan kunci menu.':
    'Enter your current PIN to disable the menu lock.',
  'Izin notifikasi ditolak. Aktifkan izin notifikasi untuk aplikasi ini di pengaturan HP.':
    'Notification permission denied. Enable it for this app in phone settings.',
  'Profil Toko & Struk': 'Store Profile & Receipt',
  Logo: 'Logo',
  'Unggah Logo': 'Upload Logo',
  'Hapus logo': 'Remove logo',
  'Nama Toko': 'Store Name',
  'Nama tokomu': 'Your store name',
  Alamat: 'Address',
  'Alamat toko': 'Store address',
  Telepon: 'Phone',
  'No. telepon': 'Phone number',
  'Catatan Bawah Struk': 'Receipt Footer Note',
  'cth. Terima kasih sudah berbelanja': 'e.g. Thank you for shopping',
  'PPN / Pajak Otomatis': 'VAT / Automatic Tax',
  'Dihitung dari subtotal saat pembayaran': 'Calculated from subtotal at checkout',
  'Besaran PPN': 'VAT Rate',
  Contoh: 'Example',
  belanja: 'shopping',
  total: 'total',
  'Pembaruan Aplikasi': 'App Update',
  'Versi terpasang:': 'Installed version:',
  'Memeriksa…': 'Checking…',
  'Cek Pembaruan': 'Check Update',
  'Aplikasi sudah versi terbaru.': 'App is already up to date.',
  'Gagal memeriksa. Periksa koneksi internet.':
    'Check failed. Check your internet connection.',
  'Cadangkan & Pulihkan': 'Backup & Restore',
  'Simpan satu berkas cadangan berisi produk, transaksi, dan pengaturan. Wajib dilakukan sebelum ganti atau hapus aplikasi.':
    'Save one backup file containing products, transactions, and settings. Required before changing or uninstalling the app.',
  'Memproses…': 'Processing…',
  'Ekspor Cadangan': 'Export Backup',
  'Pulihkan dari Cadangan': 'Restore from Backup',
  'Cadangan siap — kirim ke WhatsApp/Drive untuk disimpan.':
    'Backup ready — send it to WhatsApp/Drive to keep it safe.',
  'Gagal membuat cadangan:': 'Failed to create backup:',
  'Gagal memulihkan cadangan.': 'Failed to restore backup.',
  'Kelola Data': 'Data Management',
  'Reset Transaksi & Pengeluaran': 'Reset Transactions & Expenses',
  'Hapus Semua Data': 'Delete All Data',
  'Hapus semua riwayat transaksi & pengeluaran?':
    'Delete all transaction & expense history?',
  'PERMANEN: hapus SEMUA data (menu, transaksi, pengaturan) lalu muat ulang?':
    'PERMANENT: delete ALL data (menu, transactions, settings) then reload?',
  'Semua perubahan tersimpan otomatis di perangkat ini.':
    'All changes are saved automatically on this device.',

  // Pembaruan
  'Pembaruan Tersedia': 'Update Available',
  Baru: 'New',
  'Yang baru dalam versi ini:': "What's new in this version:",
  'Mengunduh…': 'Downloading…',
  'Berkas siap dipasang.': 'File ready to install.',
  'Menyiapkan berkas pemasangan…': 'Preparing installation file…',
  'Unduhan Selesai': 'Download Complete',
  'Menyiapkan pemasangan…': 'Preparing installation…',
  'Unduhan gagal setelah mencoba beberapa jalur.':
    'Download failed after trying several routes.',
  'Berkas APK belum dilampirkan pada rilis ini.':
    'No APK file was attached to this release.',
  'Unduh Sekarang': 'Download Now',
  'Coba Lagi': 'Try Again',
  'Unduh lewat Browser': 'Download via Browser',
  'Pasang Sekarang': 'Install Now',
  'Nanti Saja': 'Later',
  'Lihat di GitHub': 'View on GitHub',
  'Pembaruan v': 'Update v',
  tersedia: 'available',
  'Buka aplikasi untuk mengunduh versi terbaru.':
    'Open the app to download the latest version.',
  'Aplikasi Diperbarui': 'App Updated',
  'Aplikasi baru saja diperbarui ke versi': 'The app was just updated to version',
  Lanjut: 'Continue',
  'Aplikasi sudah versi terbaru': 'The app is already on the latest version',

  // Pengingat notifikasi
  'Waktunya catat penjualan': 'Time to record sales',
  'Rekap transaksi dan pengeluaran hari ini di Kasir Nusantara.':
    "Recap today's transactions and expenses in Kasir Nusantara.",

  // Tema warna
  Klasik: 'Classic',
  Batik: 'Batik',
  Laut: 'Ocean',
  Rimba: 'Forest',
  'Tema Warna': 'Color Theme',
  'Ganti nuansa warna aplikasi': 'Change the app color accent',
  'Tunggu sebentar…': 'One moment…',

  // Unduhan pembaruan
  'Jalur %s dari %s': 'Route %s of %s',
  'Beralih ke jalur lain…': 'Switching to another route…',
  'Jaringan lambat…': 'Slow network…',

  // Kolom menu & Mode Lite
  'Kolom Menu': 'Menu Columns',
  'Jumlah kolom menu di halaman kasir': 'Number of columns on the cashier page',
  '2 kolom': '2 columns',
  '3 kolom': '3 columns',
  '4 kolom': '4 columns',
  'Mode Lite': 'Lite Mode',
  'Hanya kasir & pembayaran. Keluar wajib PIN.':
    'Cashier & payment only. PIN required to exit.',
  'Buat PIN dulu di bawah untuk mengaktifkan Mode Lite.':
    'Create a PIN below first to enable Lite Mode.',
  'Keluar Mode Lite': 'Exit Lite Mode',
  'Masukkan PIN untuk kembali ke mode lengkap.':
    'Enter your PIN to return to full mode.',
  'Cadangan tersimpan di folder Documents.': 'Backup saved to your Documents folder.',
  'Notifikasi pembaruan aplikasi': 'App update notifications',

  // QRIS terkunci
  'QRIS Pembayaran': 'QRIS Payment',
  'Dikunci PIN — hanya pengelola yang bisa mengganti.':
    'PIN-locked — only the manager can change it.',
  'Buat PIN agar QRIS tidak mudah diganti.':
    'Create a PIN so the QRIS cannot be changed easily.',
  'Unggah QRIS': 'Upload QRIS',
  'Hapus QRIS': 'Remove QRIS',
  'Masukkan PIN pengelola untuk mengganti QRIS.':
    'Enter the manager PIN to change the QRIS.',
  'QRIS dihapus.': 'QRIS removed.',
  'Belum ada QRIS': 'No QRIS yet',
  'Atur QRIS lewat menu Pengaturan.': 'Set your QRIS from Settings.',
  'QRIS diatur lewat menu Pengaturan.': 'QRIS is managed from Settings.',

  // Struk
  'Struk Transaksi': 'Receipt',
  'Telp.': 'Phone',
  'No.': 'No.',
  TOTAL: 'TOTAL',
  Bayar: 'Paid',
  Kembali: 'Change',

  // Lainnya
  'Hapus pengeluaran': 'Delete expense',
}

export function t(teks) {
  if (bahasaEfektif() !== 'en') return teks
  return EN[teks] ?? teks
}

export function tp(template, nilai) {
  return template.replace('%s', nilai)
}

// Format lokal untuk tanggal & angka
export const lokale = () => (bahasaEfektif() === 'en' ? 'en-GB' : 'id-ID')

const pendengar = new Set()

export function aturBahasa(b) {
  bahasaAktif = b
  localStorage.setItem(KUNCI_SIMPAN, b)
  pendengar.forEach((fn) => fn())
}

export const bacaBahasa = () => bahasaAktif

export function pakaiBahasa() {
  const [, paksa] = useState(0)
  useEffect(() => {
    const fn = () => paksa((n) => n + 1)
    pendengar.add(fn)
    return () => pendengar.delete(fn)
  }, [])
  return [bahasaAktif, aturBahasa]
}
