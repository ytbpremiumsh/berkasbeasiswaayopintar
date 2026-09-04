INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('administration_results_page', '{"is_published": false}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

CREATE POLICY "Anyone can read administration results setting"
ON public.admin_settings
FOR SELECT
TO anon, authenticated
USING (setting_key = 'administration_results_page');

DROP FUNCTION IF EXISTS public.get_published_administration_results();

CREATE OR REPLACE FUNCTION public.get_administration_result_by_token(p_token_code text)
RETURNS TABLE (
  full_name text,
  category public.scholarship_category,
  applicant_status public.applicant_status,
  institution_name text,
  program_name text,
  status public.submission_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    submission.full_name,
    submission.category,
    submission.applicant_status,
    submission.institution_name,
    program.name AS program_name,
    submission.status
  FROM public.scholarship_submissions AS submission
  INNER JOIN public.scholarship_tokens AS token
    ON token.id = submission.token_id
  INNER JOIN public.scholarship_programs AS program
    ON program.id = submission.program_id
  WHERE upper(token.token_code) = upper(trim(p_token_code))
    AND length(trim(p_token_code)) BETWEEN 6 AND 100
    AND program.is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.admin_settings AS setting
      WHERE setting.setting_key = 'administration_results_page'
        AND COALESCE((setting.setting_value ->> 'is_published')::boolean, false) = true
    )
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_administration_result_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_administration_result_by_token(text) TO anon, authenticated;
