
-- Create table for logging status check activities
CREATE TABLE public.check_status_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_code TEXT NOT NULL,
  result TEXT NOT NULL, -- 'not_found', 'valid_no_submission', 'has_submission'
  submission_name TEXT,
  ip_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.check_status_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert logs (public page)
CREATE POLICY "Anyone can insert check status logs"
ON public.check_status_logs
FOR INSERT
WITH CHECK (true);

-- Only admins can view logs
CREATE POLICY "Admins can view check status logs"
ON public.check_status_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete logs
CREATE POLICY "Admins can delete check status logs"
ON public.check_status_logs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
