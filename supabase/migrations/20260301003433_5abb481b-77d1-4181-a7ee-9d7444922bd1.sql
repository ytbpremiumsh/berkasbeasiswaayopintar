CREATE POLICY "Anyone can read check_status_button setting"
ON public.admin_settings
FOR SELECT
USING (setting_key = 'check_status_button');