-- Create enum for applicant status
CREATE TYPE public.applicant_status AS ENUM ('pelajar', 'gap_year', 'mahasiswa');

-- Create enum for submission status
CREATE TYPE public.submission_status AS ENUM ('menunggu', 'diverifikasi', 'ditolak');

-- Create enum for scholarship category
CREATE TYPE public.scholarship_category AS ENUM ('prestasi', 'yatim', 'ekonomi', 'umum');

-- Create enum for token status
CREATE TYPE public.token_status AS ENUM ('valid', 'digunakan', 'tidak_valid');

-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create scholarship tokens table
CREATE TABLE public.scholarship_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_code TEXT NOT NULL UNIQUE,
  category scholarship_category NOT NULL,
  status token_status NOT NULL DEFAULT 'valid',
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scholarship_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can validate tokens"
ON public.scholarship_tokens FOR SELECT
USING (true);

CREATE POLICY "Admins can manage tokens"
ON public.scholarship_tokens FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can update token status"
ON public.scholarship_tokens FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create scholarship submissions table
CREATE TABLE public.scholarship_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token_id UUID REFERENCES public.scholarship_tokens(id) NOT NULL,
  category scholarship_category NOT NULL,
  applicant_status applicant_status NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Document URLs
  kartu_pelajar_url TEXT,
  ktm_url TEXT,
  cv_url TEXT,
  sertifikat_prestasi_url TEXT,
  transkrip_nilai_url TEXT,
  khs_url TEXT,
  essay TEXT,
  bukti_penghasilan_url TEXT,
  bukti_listrik_url TEXT,
  surat_keterangan_yatim_url TEXT,
  sktm_url TEXT,
  video_tiktok_url TEXT,
  berkas_pendukung_url TEXT,
  bukti_struk_url TEXT,
  
  status submission_status NOT NULL DEFAULT 'menunggu',
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scholarship_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions"
ON public.scholarship_submissions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own submissions"
ON public.scholarship_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions"
ON public.scholarship_submissions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update submissions"
ON public.scholarship_submissions FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create admin settings table
CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings"
ON public.admin_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read URL settings"
ON public.admin_settings FOR SELECT
USING (setting_key LIKE 'url_%');

-- Create category URLs settings table
CREATE TABLE public.category_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category scholarship_category NOT NULL UNIQUE,
  custom_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.category_urls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view category URLs"
ON public.category_urls FOR SELECT
USING (true);

CREATE POLICY "Admins can manage category URLs"
ON public.category_urls FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.scholarship_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_urls_updated_at
  BEFORE UPDATE ON public.category_urls
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default category URLs
INSERT INTO public.category_urls (category, custom_url) VALUES
  ('prestasi', 'beasiswa-prestasi'),
  ('yatim', 'beasiswa-yatim'),
  ('ekonomi', 'beasiswa-ekonomi'),
  ('umum', 'beasiswa-umum');

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('scholarship-documents', 'scholarship-documents', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'scholarship-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'scholarship-documents');

CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'scholarship-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'scholarship-documents' AND auth.uid()::text = (storage.foldername(name))[1]);