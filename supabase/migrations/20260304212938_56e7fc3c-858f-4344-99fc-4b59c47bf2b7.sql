CREATE POLICY "Anyone can read peraih_beasiswa_page setting"
ON public.admin_settings
FOR SELECT
USING (setting_key = 'peraih_beasiswa_page');