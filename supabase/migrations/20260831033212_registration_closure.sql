-- Global switch: preserve open registration until an administrator closes it.
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('registration_status', '{"is_open":true,"closed_message":"Pendaftaran dan pengiriman berkas beasiswa telah ditutup. Terima kasih atas partisipasi Anda."}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Only this non-sensitive setting becomes publicly readable.
CREATE POLICY "Public can read registration status"
ON public.admin_settings FOR SELECT TO anon, authenticated
USING (setting_key = 'registration_status');

CREATE FUNCTION public.require_registration_open()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE config jsonb;
BEGIN
  SELECT setting_value INTO config FROM public.admin_settings
  WHERE setting_key = 'registration_status';
  IF config IS NULL OR config->'is_open' IS DISTINCT FROM 'true'::jsonb THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE =
      COALESCE(NULLIF(btrim(config->>'closed_message'), ''),
        'Pendaftaran dan pengiriman berkas beasiswa telah ditutup.');
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.require_registration_open() FROM PUBLIC;

-- Triggers also protect inserts through the service role / Edge Functions.
CREATE TRIGGER require_open_scholarship_submission
BEFORE INSERT ON public.scholarship_submissions
FOR EACH ROW EXECUTE FUNCTION public.require_registration_open();
CREATE TRIGGER require_open_registration
BEFORE INSERT ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.require_registration_open();
CREATE TRIGGER require_open_token_consumption
BEFORE UPDATE OF status ON public.scholarship_tokens
FOR EACH ROW WHEN (NEW.status = 'digunakan' AND OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.require_registration_open();

-- Consume the token in the same transaction as the submission. Any insert or
-- closure error rolls everything back; a rejected submission cannot burn a token.
CREATE FUNCTION public.consume_submission_token()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  UPDATE public.scholarship_tokens
    SET status = 'digunakan', used_at = now()
    WHERE id = NEW.token_id AND status = 'valid';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token sudah digunakan atau tidak valid';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.consume_submission_token() FROM PUBLIC;
CREATE TRIGGER consume_token_after_submission
AFTER INSERT ON public.scholarship_submissions
FOR EACH ROW EXECUTE FUNCTION public.consume_submission_token();

-- RESTRICTIVE means an existing permissive upload policy cannot bypass closure.
-- Read/download/delete permissions and other buckets remain unchanged.
CREATE POLICY "Registration gate for document inserts"
ON storage.objects AS RESTRICTIVE FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id <> 'scholarship-documents' OR EXISTS (
  SELECT 1 FROM public.admin_settings
  WHERE setting_key = 'registration_status' AND setting_value->'is_open' = 'true'::jsonb
));
CREATE POLICY "Registration gate for document updates"
ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon, authenticated
USING (bucket_id <> 'scholarship-documents' OR EXISTS (
  SELECT 1 FROM public.admin_settings
  WHERE setting_key = 'registration_status' AND setting_value->'is_open' = 'true'::jsonb
))
WITH CHECK (bucket_id <> 'scholarship-documents' OR EXISTS (
  SELECT 1 FROM public.admin_settings
  WHERE setting_key = 'registration_status' AND setting_value->'is_open' = 'true'::jsonb
));
