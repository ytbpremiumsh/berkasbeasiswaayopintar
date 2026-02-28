
-- Create banners table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shortlinks table
CREATE TABLE IF NOT EXISTS public.shortlinks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  destination_url TEXT NOT NULL,
  title TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shortlink_visits table
CREATE TABLE IF NOT EXISTS public.shortlink_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shortlink_id UUID NOT NULL REFERENCES public.shortlinks(id) ON DELETE CASCADE,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  referrer TEXT
);

-- Add missing columns to scholarship_submissions
ALTER TABLE public.scholarship_submissions 
  ADD COLUMN IF NOT EXISTS institution_name TEXT,
  ADD COLUMN IF NOT EXISTS verified_by UUID,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- RLS for banners (public read, admin write)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS for shortlinks (public read for redirect, admin write)
ALTER TABLE public.shortlinks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active shortlinks" ON public.shortlinks FOR SELECT USING (true);
CREATE POLICY "Admins can manage shortlinks" ON public.shortlinks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS for shortlink_visits
ALTER TABLE public.shortlink_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert visits" ON public.shortlink_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view visits" ON public.shortlink_visits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
