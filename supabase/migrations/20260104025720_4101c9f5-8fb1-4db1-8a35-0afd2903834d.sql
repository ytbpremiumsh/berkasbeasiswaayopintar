-- Create shortlinks table for URL shortener with analytics
CREATE TABLE public.shortlinks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  destination_url TEXT NOT NULL,
  title TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create shortlink_visits table for detailed analytics
CREATE TABLE public.shortlink_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shortlink_id UUID NOT NULL REFERENCES public.shortlinks(id) ON DELETE CASCADE,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  referrer TEXT,
  country TEXT,
  city TEXT
);

-- Enable RLS
ALTER TABLE public.shortlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlink_visits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shortlinks
CREATE POLICY "Admins can manage shortlinks" 
ON public.shortlinks 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active shortlinks" 
ON public.shortlinks 
FOR SELECT 
USING (is_active = true);

-- RLS Policies for shortlink_visits
CREATE POLICY "Admins can view all visits" 
ON public.shortlink_visits 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Allow insert visits for everyone" 
ON public.shortlink_visits 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_shortlinks_slug ON public.shortlinks(slug);
CREATE INDEX idx_shortlink_visits_shortlink_id ON public.shortlink_visits(shortlink_id);
CREATE INDEX idx_shortlink_visits_visited_at ON public.shortlink_visits(visited_at);

-- Add trigger for updated_at
CREATE TRIGGER update_shortlinks_updated_at
BEFORE UPDATE ON public.shortlinks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();