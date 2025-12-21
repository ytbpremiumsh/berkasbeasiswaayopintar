-- Create table for custom form fields per category
CREATE TABLE public.form_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR(20) NOT NULL CHECK (category IN ('prestasi', 'yatim', 'ekonomi', 'umum')),
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'textarea', 'file', 'url')),
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, field_name)
);

-- Enable RLS
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;

-- Admins can manage form fields
CREATE POLICY "Admins can manage form fields"
ON public.form_fields
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active form fields
CREATE POLICY "Anyone can view active form fields"
ON public.form_fields
FOR SELECT
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_form_fields_updated_at
BEFORE UPDATE ON public.form_fields
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();