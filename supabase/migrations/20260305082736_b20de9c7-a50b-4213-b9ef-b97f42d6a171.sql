
-- Create registrations table for storing registration entries
CREATE TABLE public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category varchar NOT NULL,
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create registration_fields table for configurable form fields
CREATE TABLE public.registration_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category varchar NOT NULL,
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type varchar NOT NULL DEFAULT 'text',
  is_required boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  description text,
  placeholder text,
  options jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category, field_name)
);

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_fields ENABLE ROW LEVEL SECURITY;

-- RLS for registrations: anyone can insert, admins can manage
CREATE POLICY "Anyone can insert registrations" ON public.registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view registrations" ON public.registrations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view registrations" ON public.registrations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins can delete registrations" ON public.registrations
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update registrations" ON public.registrations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS for registration_fields
CREATE POLICY "Admins can manage registration fields" ON public.registration_fields
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active registration fields" ON public.registration_fields
  FOR SELECT
  USING (is_active = true);

-- Add updated_at triggers
CREATE TRIGGER handle_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_registration_fields_updated_at
  BEFORE UPDATE ON public.registration_fields
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default registration fields for all categories
INSERT INTO public.registration_fields (category, field_name, field_label, field_type, is_required, display_order, placeholder, options) VALUES
  ('prestasi', 'full_name', 'Nama Lengkap', 'text', true, 1, 'Tuliskan nama lengkap', null),
  ('prestasi', 'phone', 'Nomor WhatsApp', 'text', true, 2, 'Pastikan nomor whatsapp aktif', null),
  ('prestasi', 'email', 'Alamat Email', 'text', true, 3, 'Pastikan email aktif dan tidak typo', null),
  ('prestasi', 'education_level', 'Jenjang Pendidikan', 'select', true, 4, '- Pilih Jenjang -', '["SMP","SMA/SMK","D3","S1","S2","S3"]'),
  ('prestasi', 'institution_name', 'Nama Sekolah / Universitas', 'text', true, 5, 'Tuliskan nama sekolah', null),
  ('prestasi', 'instagram', 'Nama Instagram', 'text', true, 6, 'Username instagram', null),
  ('yatim', 'full_name', 'Nama Lengkap', 'text', true, 1, 'Tuliskan nama lengkap', null),
  ('yatim', 'phone', 'Nomor WhatsApp', 'text', true, 2, 'Pastikan nomor whatsapp aktif', null),
  ('yatim', 'email', 'Alamat Email', 'text', true, 3, 'Pastikan email aktif dan tidak typo', null),
  ('yatim', 'education_level', 'Jenjang Pendidikan', 'select', true, 4, '- Pilih Jenjang -', '["SMP","SMA/SMK","D3","S1","S2","S3"]'),
  ('yatim', 'institution_name', 'Nama Sekolah / Universitas', 'text', true, 5, 'Tuliskan nama sekolah', null),
  ('yatim', 'instagram', 'Nama Instagram', 'text', true, 6, 'Username instagram', null),
  ('ekonomi', 'full_name', 'Nama Lengkap', 'text', true, 1, 'Tuliskan nama lengkap', null),
  ('ekonomi', 'phone', 'Nomor WhatsApp', 'text', true, 2, 'Pastikan nomor whatsapp aktif', null),
  ('ekonomi', 'email', 'Alamat Email', 'text', true, 3, 'Pastikan email aktif dan tidak typo', null),
  ('ekonomi', 'education_level', 'Jenjang Pendidikan', 'select', true, 4, '- Pilih Jenjang -', '["SMP","SMA/SMK","D3","S1","S2","S3"]'),
  ('ekonomi', 'institution_name', 'Nama Sekolah / Universitas', 'text', true, 5, 'Tuliskan nama sekolah', null),
  ('ekonomi', 'instagram', 'Nama Instagram', 'text', true, 6, 'Username instagram', null),
  ('umum', 'full_name', 'Nama Lengkap', 'text', true, 1, 'Tuliskan nama lengkap', null),
  ('umum', 'phone', 'Nomor WhatsApp', 'text', true, 2, 'Pastikan nomor whatsapp aktif', null),
  ('umum', 'email', 'Alamat Email', 'text', true, 3, 'Pastikan email aktif dan tidak typo', null),
  ('umum', 'education_level', 'Jenjang Pendidikan', 'select', true, 4, '- Pilih Jenjang -', '["SMP","SMA/SMK","D3","S1","S2","S3"]'),
  ('umum', 'institution_name', 'Nama Sekolah / Universitas', 'text', true, 5, 'Tuliskan nama sekolah', null),
  ('umum', 'instagram', 'Nama Instagram', 'text', true, 6, 'Username instagram', null);
