
-- Create scholarship_programs table
CREATE TABLE public.scholarship_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scholarship_programs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage programs" ON public.scholarship_programs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff can view programs" ON public.scholarship_programs FOR SELECT USING (has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Anyone can view active programs" ON public.scholarship_programs FOR SELECT USING (is_active = true);

-- Add program_id to scholarship_submissions
ALTER TABLE public.scholarship_submissions ADD COLUMN program_id uuid REFERENCES public.scholarship_programs(id);

-- Add program_id to scholarship_tokens
ALTER TABLE public.scholarship_tokens ADD COLUMN program_id uuid REFERENCES public.scholarship_programs(id);

-- Add program_id to registrations
ALTER TABLE public.registrations ADD COLUMN program_id uuid REFERENCES public.scholarship_programs(id);

-- Insert default program for existing data
INSERT INTO public.scholarship_programs (id, name, description, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Beasiswa Batch 1', 'Program beasiswa pertama', true);

-- Assign existing data to the default program
UPDATE public.scholarship_submissions SET program_id = '00000000-0000-0000-0000-000000000001' WHERE program_id IS NULL;
UPDATE public.scholarship_tokens SET program_id = '00000000-0000-0000-0000-000000000001' WHERE program_id IS NULL;
UPDATE public.registrations SET program_id = '00000000-0000-0000-0000-000000000001' WHERE program_id IS NULL;

-- Updated_at trigger
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.scholarship_programs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
