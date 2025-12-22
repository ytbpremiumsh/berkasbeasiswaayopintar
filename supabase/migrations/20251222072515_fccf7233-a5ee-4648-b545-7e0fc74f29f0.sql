-- Create success page templates table for each category
CREATE TABLE public.success_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR NOT NULL,
  title TEXT NOT NULL DEFAULT 'Berkas Terkirim!',
  description TEXT NOT NULL DEFAULT 'Pengajuan beasiswa Anda telah berhasil dikirim. Tim kami akan memverifikasi berkas Anda dalam waktu 3-7 hari kerja.',
  note TEXT DEFAULT 'Kami akan mengirimkan notifikasi melalui WhatsApp dan email setelah proses verifikasi selesai.',
  button_text TEXT NOT NULL DEFAULT 'Kembali ke Beranda',
  button_link TEXT NOT NULL DEFAULT '/',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category)
);

-- Enable RLS
ALTER TABLE public.success_templates ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage templates
CREATE POLICY "Admins can manage success templates"
ON public.success_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow anyone to view templates
CREATE POLICY "Anyone can view success templates"
ON public.success_templates
FOR SELECT
USING (is_active = true);

-- Insert default templates for each category
INSERT INTO public.success_templates (category, title, description, note, button_text, button_link)
VALUES 
  ('prestasi', 'Berkas Beasiswa Prestasi Terkirim!', 'Pengajuan beasiswa prestasi Anda telah berhasil dikirim. Tim kami akan memverifikasi berkas Anda dalam waktu 3-7 hari kerja.', 'Kami akan mengirimkan notifikasi melalui WhatsApp dan email setelah proses verifikasi selesai.', 'Kembali ke Beranda', '/'),
  ('yatim', 'Berkas Beasiswa Yatim Terkirim!', 'Pengajuan beasiswa yatim Anda telah berhasil dikirim. Tim kami akan memverifikasi berkas Anda dalam waktu 3-7 hari kerja.', 'Kami akan mengirimkan notifikasi melalui WhatsApp dan email setelah proses verifikasi selesai.', 'Kembali ke Beranda', '/'),
  ('ekonomi', 'Berkas Beasiswa Ekonomi Terkirim!', 'Pengajuan beasiswa ekonomi Anda telah berhasil dikirim. Tim kami akan memverifikasi berkas Anda dalam waktu 3-7 hari kerja.', 'Kami akan mengirimkan notifikasi melalui WhatsApp dan email setelah proses verifikasi selesai.', 'Kembali ke Beranda', '/'),
  ('umum', 'Berkas Beasiswa Umum Terkirim!', 'Pengajuan beasiswa umum Anda telah berhasil dikirim. Tim kami akan memverifikasi berkas Anda dalam waktu 3-7 hari kerja.', 'Kami akan mengirimkan notifikasi melalui WhatsApp dan email setelah proses verifikasi selesai.', 'Kembali ke Beranda', '/');

-- Add trigger for updated_at
CREATE TRIGGER update_success_templates_updated_at
  BEFORE UPDATE ON public.success_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();