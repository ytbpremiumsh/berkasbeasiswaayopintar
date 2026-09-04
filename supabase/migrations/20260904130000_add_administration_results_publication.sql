INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('administration_results_page', '{"is_published": false}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

CREATE POLICY "Anyone can read administration results setting"
ON public.admin_settings
FOR SELECT
TO anon, authenticated
USING (setting_key = 'administration_results_page');

CREATE OR REPLACE FUNCTION public.get_published_administration_results()
RETURNS TABLE (
  id uuid,
  full_name text,
  category public.scholarship_category,
  applicant_status public.applicant_status,
  institution_name text,
  program_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    submission.id,
    submission.full_name,
    submission.category,
    submission.applicant_status,
    submission.institution_name,
    program.name AS program_name
  FROM public.scholarship_submissions AS submission
  INNER JOIN public.scholarship_programs AS program
    ON program.id = submission.program_id
  WHERE submission.status = 'diverifikasi'::public.submission_status
    AND program.is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.admin_settings AS setting
      WHERE setting.setting_key = 'administration_results_page'
        AND COALESCE((setting.setting_value ->> 'is_published')::boolean, false) = true
    )
  ORDER BY submission.full_name ASC;
$$;

REVOKE ALL ON FUNCTION public.get_published_administration_results() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_administration_results() TO anon, authenticated;

