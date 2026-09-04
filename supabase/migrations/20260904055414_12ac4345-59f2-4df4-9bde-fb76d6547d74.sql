ALTER TABLE public.scholarship_tokens
  ADD COLUMN IF NOT EXISTS mayar_transaction_id text,
  ADD COLUMN IF NOT EXISTS price numeric;