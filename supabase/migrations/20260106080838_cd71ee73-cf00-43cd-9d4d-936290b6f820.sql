-- Create whatsapp_logs table for tracking sent messages
CREATE TABLE public.whatsapp_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
  error_message TEXT,
  submission_id UUID REFERENCES public.scholarship_submissions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin/staff to view logs
CREATE POLICY "Admin and staff can view whatsapp logs"
ON public.whatsapp_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'staff')
  )
);

-- Create policy for service role to insert logs
CREATE POLICY "Service role can insert logs"
ON public.whatsapp_logs
FOR INSERT
WITH CHECK (true);

-- Add whatsapp_enabled setting
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('whatsapp_enabled', '{"value": true}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Add index for faster queries
CREATE INDEX idx_whatsapp_logs_created_at ON public.whatsapp_logs(created_at DESC);
CREATE INDEX idx_whatsapp_logs_status ON public.whatsapp_logs(status);