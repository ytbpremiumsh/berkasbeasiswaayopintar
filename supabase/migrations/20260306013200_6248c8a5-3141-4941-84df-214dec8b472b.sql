
CREATE TABLE public.external_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  description text,
  icon_name text DEFAULT 'Globe',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.external_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage external apps" ON public.external_apps FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff can view active external apps" ON public.external_apps FOR SELECT USING (has_role(auth.uid(), 'staff'::app_role) AND is_active = true);
