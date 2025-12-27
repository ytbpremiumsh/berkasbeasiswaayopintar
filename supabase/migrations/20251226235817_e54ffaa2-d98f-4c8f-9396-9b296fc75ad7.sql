-- Create table for AdSense settings
CREATE TABLE IF NOT EXISTS public.adsense_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_key text NOT NULL UNIQUE,
  adsense_code text,
  is_active boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.adsense_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage adsense settings"
ON public.adsense_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active adsense settings"
ON public.adsense_settings
FOR SELECT
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_adsense_settings_updated_at
  BEFORE UPDATE ON public.adsense_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default placements
INSERT INTO public.adsense_settings (placement_key, description) VALUES
  ('header', 'Iklan di bagian header/atas halaman'),
  ('sidebar', 'Iklan di sidebar'),
  ('content_top', 'Iklan di atas konten utama'),
  ('content_bottom', 'Iklan di bawah konten utama'),
  ('footer', 'Iklan di bagian footer/bawah halaman'),
  ('between_sections', 'Iklan di antara section')
ON CONFLICT (placement_key) DO NOTHING;