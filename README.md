# Beasiswa Form Ayo Pintar

Buatkan sebuah website full-stack khusus untuk Form Pengiriman Berkas Beasiswa, lengkap dengan Dashboard Admin.
Gunakan Bahasa Indonesia, UI rapi, modern, mobile-friendly, dan mudah digunakan oleh pelajar maupun mahasiswa.

🔐 SISTEM GLOBAL
1. Pilihan Jenjang (WAJIB – DROPDOWN)

Sediakan dropdown “Status Pendaftar” dengan pilihan:

Pelajar

Gap Year (Masuk dalam kategori Pelajar)

Mahasiswa

Status ini akan menentukan jenis berkas yang wajib diunggah di setiap kategori.

2. Validasi Kode Token (Integrasi Mayar)

Sebelum peserta mengisi form berkas:

Tampilkan field input: “Kode Token Beasiswa”

Sistem melakukan validasi Kode Token ke sistem Mayar

Jika Kode Token valid → lanjut ke form

Jika tidak valid → tampilkan pesan “Kode Token tidak ditemukan, silakan klaim token terlebih dahulu”

Setiap kategori beasiswa memiliki field Kode Token sendiri

Gunakan istilah Kode Token, bukan Lisensi

📂 HALAMAN KATEGORI BEASISWA

(Setiap kategori memiliki URL sendiri & bisa diatur dari Admin)

🏆 KATEGORI BEASISWA PRESTASI


Field Upload (gunakan upload file & dropdown bila relevan):

Kartu Pelajar / KTA (Pelajar, Gap Year)

Kartu Tanda Mahasiswa / Dokumen Resmi Lainnya (Mahasiswa)

Curriculum Vitae (CV)

Sertifikat Prestasi (Akademik / Non Akademik)

Transkrip Nilai (Mahasiswa)

Kartu Hasil Studi (KHS) (Mahasiswa)

Berkas Pendukung Lainnya (Opsional)

Bukti Struk Telah Memilih Berkas

👨‍👩‍👧 KATEGORI BEASISWA YATIM

Field Upload:

Kartu Pelajar / KTA (Pelajar, Gap Year)

Kartu Tanda Mahasiswa / Dokumen Resmi Lainnya (Mahasiswa)

Esai / Pernyataan Pribadi (maks. 500 kata – textarea)

Bukti Penghasilan Orang Tua / Wali

Bukti Pembayaran Listrik / Token (bulan terakhir)

Surat Keterangan Yatim / Dokumen Pendukung

Berkas Pendukung Lainnya

Bukti Struk Telah Memilih Berkas

💰 KATEGORI BEASISWA EKONOMI


Field Upload:

Kartu Pelajar / KTA (Pelajar, Gap Year)

Kartu Tanda Mahasiswa / Dokumen Resmi Lainnya (Mahasiswa)

Esai / Pernyataan Pribadi (maks. 500 kata)

Bukti Penghasilan Orang Tua / Wali

Bukti Pembayaran Listrik / Token (bulan terakhir)

Surat Keterangan Tidak Mampu (SKTM)

Berkas Pendukung Lainnya

Bukti Struk Telah Memilih Berkas

🌐 KATEGORI BEASISWA UMUM

Field Upload:

Kartu Pelajar / KTA (Pelajar, Gap Year)

Kartu Tanda Mahasiswa / Dokumen Resmi Lainnya (Mahasiswa)

Esai / Pernyataan Pribadi (500–1.000 kata)

Video TikTok minimal 1 menit
(Penjelasan tentang Beasiswa Pendidikan Ayo Pintar – URL atau upload)

Sertifikat Prestasi

Berkas Pendukung Lainnya

Bukti Struk Telah Memilih Berkas

📊 DASHBOARD ADMIN
Fitur Wajib:
1. Manajemen Data Masuk

Lihat data berkas masuk per kategori

Filter berdasarkan:

Kategori Beasiswa

Status (Pelajar / Gap Year / Mahasiswa)

Tanggal pengiriman

Preview & download semua berkas

Status berkas:

Menunggu

Diverifikasi

Ditolak

2. Pengaturan OneSender (WhatsApp)

Input:

API Key OneSender

Nomor pengirim

Template pesan WhatsApp

Pesan otomatis dikirim setelah peserta submit form

Pesan bisa memanggil field:

{{nama}}

{{kategori_beasiswa}}

{{status_pendaftar}}

{{tanggal_submit}}

3. Pengaturan URL Halaman

Admin bisa mengatur URL untuk:

Beasiswa Prestasi

Beasiswa Yatim

Beasiswa Ekonomi

Beasiswa Umum

4. Manajemen Kode Token

Validasi Kode Token ke Mayar

Log penggunaan Kode Token

Status:

Valid

Digunakan

Tidak valid

🎨 UI / UX

Desain profesional, bersih, dan ramah mobile

Step form (Progress bar)

Validasi real-time

Notifikasi sukses / gagal

Loading indicator saat upload & validasi token

⚙️ TEKNIS

Gunakan arsitektur modern

Backend siap integrasi API eksternal (Mayar & OneSender)

Sistem aman, role Admin & User terpisah

Siap dikembangkan ke tahap produksi

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://berkasbeasiswa.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d540bab4-0418-4e09-bc49-bd10455a4ee6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
