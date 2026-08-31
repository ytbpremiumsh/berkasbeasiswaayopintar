# Kontrol buka/tutup pendaftaran

Status: implementasi disiapkan pada branch `feat/registration-closure`. Belum diterapkan pada database atau website produksi.

## Perilaku

Di **Admin → Pengaturan → Status Pendaftaran & Pengiriman Berkas**, administrator dapat mengubah toggle, mengisi teks penutupan maksimal 2.000 karakter, lalu menekan **Simpan Status Pendaftaran**. Pengaturan bersifat global untuk semua program/kategori. Default migrasi adalah terbuka; migrasi tidak menutup periode yang sedang berlangsung.

Saat ditutup, `/beasiswa/:category`, `/daftar/:category`, serta `?embed=true` menampilkan pesan penutupan tanpa form. Status diperiksa sebelum validasi token, unggah, dan submit, serta setiap 60 detik selama tab terlihat dan ketika tab memperoleh fokus. Kegagalan membaca status memblokir form dengan pilihan mencoba lagi.

Backend memeriksa status sebelum memproses berkas dan sebelum validasi token baru. `checkOnly=true` tetap dapat memeriksa status token. Trigger database menolak pendaftaran dan pengajuan baru, termasuk melalui service role. Kebijakan Storage restrictive menolak upload, update, dan upsert peserta pada bucket `scholarship-documents` meskipun ada policy permissive lain. Hak baca/unduh yang sudah ada, bucket lain, dan pengelolaan status data lama tidak diubah.

Pemakaian token kini berada dalam transaksi yang sama dengan insert pengajuan. Pengajuan gagal tidak menghabiskan token. Dua kiriman dengan token yang sama tidak bisa sama-sama berhasil.

## Penerapan wajib oleh pemilik backend

Akses Supabase ke proyek `qdrirujodheglkocjmui` ditolak untuk akun yang terhubung pada sesi pengerjaan. Tidak ada perubahan database atau deployment Edge Function yang dilakukan.

Perubahan ini harus diterapkan sebagai satu rilis terkoordinasi. **Jangan hanya menerapkan frontend atau hanya memperbarui Edge Function.**

1. Ambil branch/PR ini di lingkungan pemilik proyek. Siapkan deployment frontend dan kedua Edge Function terlebih dahulu.
2. Terapkan `supabase/migrations/20260831033212_registration_closure.sql` pada proyek yang sesuai menggunakan workflow migrasi Supabase/Lovable.
3. Segera deploy `submit-scholarship` dan `verify-license` bersama `supabase/functions/_shared/registration-status.ts`. Pertahankan pengaturan autentikasi/JWT produksi yang sudah ada.
4. Setelah backend siap, gabungkan/publikasikan frontend dari commit yang sama.
5. Masuk sebagai admin, uji teks penutupan, matikan toggle, dan simpan. Uji seluruh kategori pada dua jenis form termasuk embed; gunakan akun/data uji.
6. Coba mengirim dari tab lama dan upload langsung sebagai peserta: harus ditolak. Pastikan token tetap valid jika ditolak. Admin tetap dapat memverifikasi data lama.
7. Aktifkan kembali toggle untuk memastikan form pulih; kemudian simpan status akhir yang diinginkan.

**Catatan transisi:** di antara langkah 2 dan 3, Edge Function lama masih mencoba memakai token sebelum insert. Trigger transaksi yang baru akan menolak kiriman tersebut. Karena itu lakukan langkah backend berurutan dalam jendela pemeliharaan, bukan membiarkan rilis parsial. Jangan rollback hanya salah satu bagian backend.

## Pengujian

- `npm run build`: lulus. Peringatan bawaan: urutan CSS `@import`, data Browserslist lama, dan ukuran bundle besar.
- `npx tsc --noEmit -p tsconfig.app.json`: lulus.
- ESLint untuk tiga modul frontend baru: lulus.
- `npm run test:registration`: 13 skenario lulus pada PostgreSQL terisolasi (PGlite), menggunakan tabel fixture minimal dan migration yang sebenarnya.
- Uji mencakup pembacaan setting non-sensitif, larangan edit oleh peserta, status terbuka/tertutup, service role, token, upload/overwrite/upsert untuk anon dan authenticated, data lama, bucket lain, buka kembali, serta status hilang/rusak.
- Pengujian ini bukan verifikasi konfigurasi RLS, Storage, Edge Functions, atau data produksi yang sebenarnya.
- Pengujian visual browser belum selesai karena unduhan browser tidak tersedia pada lingkungan pengerjaan. Tidak ada klaim uji end-to-end pada website aktif.

## Prompt penerapan di Lovable

> Terapkan PR/branch `feat/registration-closure` dari repositori ytbpremiumsh/berkasbeasiswaayopintar sebagai satu rilis frontend dan backend. Pastikan target backend qdrirujodheglkocjmui. Terapkan migration 20260831033212_registration_closure.sql, lalu segera deploy submit-scholarship dan verify-license beserta shared registration-status.ts dengan pengaturan JWT yang sama seperti produksi, sebelum memublikasikan frontend. Jangan hanya menyembunyikan form. Jalankan npm run test:registration dan npm run build, lalu uji dengan data uji bahwa toggle di Admin → Pengaturan menolak pendaftaran, pengiriman berkas, dan unggah saat ditutup, termasuk embed dan tab lama. Jangan hapus data lama. Default tetap terbuka sampai admin menentukan status akhir. Laporkan hasil penerapan database, Edge Functions, dan frontend secara terpisah.
