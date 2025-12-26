-- Create table to store staff/user additional info for admin management
CREATE TABLE IF NOT EXISTS public.managed_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text,
  role app_role NOT NULL DEFAULT 'staff',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.managed_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for managed_accounts
CREATE POLICY "Admins can manage all accounts"
ON public.managed_accounts
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view own account"
ON public.managed_accounts
FOR SELECT
USING (auth.uid() = user_id);

-- Update trigger for updated_at
CREATE TRIGGER update_managed_accounts_updated_at
  BEFORE UPDATE ON public.managed_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Allow staff to view submissions (read-only for reviewing)
CREATE POLICY "Staff can view all submissions"
ON public.scholarship_submissions
FOR SELECT
USING (has_role(auth.uid(), 'staff'));