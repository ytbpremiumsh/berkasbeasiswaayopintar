-- Create banners table for carousel
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- RLS policies for banners
CREATE POLICY "Anyone can view active banners"
  ON public.banners FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage banners"
  ON public.banners FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Add verified_by column to scholarship_submissions
ALTER TABLE public.scholarship_submissions
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Insert default adsense settings if not exists
INSERT INTO public.adsense_settings (placement_key, description, is_active) VALUES
  ('header', 'Iklan di bagian atas halaman, muncul setelah header', false),
  ('sidebar', 'Iklan di sidebar (jika ada)', false),
  ('content_top', 'Iklan di atas konten utama', false),
  ('content_bottom', 'Iklan di bawah konten utama', false),
  ('footer', 'Iklan di bagian bawah halaman sebelum footer', false),
  ('between_sections', 'Iklan di antara section/bagian konten', false)
ON CONFLICT (placement_key) DO NOTHING;