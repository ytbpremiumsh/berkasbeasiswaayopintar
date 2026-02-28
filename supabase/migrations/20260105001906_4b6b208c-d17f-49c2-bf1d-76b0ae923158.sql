-- Add countdown_date setting to admin_settings if not exists
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('countdown_date', '{"value": "", "title": "Pendaftaran Beasiswa", "enabled": false}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Add default success templates for all categories
INSERT INTO public.success_templates (category, title, description, note, button_text, button_link, is_active)
VALUES 
  ('prestasi', 'Berkas Terkirim!', 'Pengajuan beasiswa prestasi Anda telah berhasil dikirim. Tim kami akan memverifikasi berkas Anda dalam waktu 3-7 hari kerja.', 'Kami akan mengirimkan notifikasi melalui WhatsApp dan email setelah proses verifikasi selesai.', 'Kembali ke Beranda', '/', true),
  ('yatim', 'Berkas Terkirim!', 'Pengajuan beasiswa yatim Anda telah berhasil dikirim. Tim kami akan memverifikasi berkas Anda dalam waktu 3-7 hari kerja.', 'Kami akan mengirimkan notifikasi melalui WhatsApp dan email setelah proses verifikasi selesai.', 'Kembali ke Beranda', '/', true),
  ('ekonomi', 'Berkas Terkirim!', 'Pengajuan beasiswa ekonomi Anda telah berhasil dikirim. Tim kami akan memverifikasi berkas Anda dalam waktu 3-7 hari kerja.', 'Kami akan mengirimkan notifikasi melalui WhatsApp dan email setelah proses verifikasi selesai.', 'Kembali ke Beranda', '/', true),
  ('umum', 'Berkas Terkirim!', 'Pengajuan beasiswa umum Anda telah berhasil dikirim. Tim kami akan memverifikasi berkas Anda dalam waktu 3-7 hari kerja.', 'Kami akan mengirimkan notifikasi melalui WhatsApp dan email setelah proses verifikasi selesai.', 'Kembali ke Beranda', '/', true)
ON CONFLICT (category) DO NOTHING;