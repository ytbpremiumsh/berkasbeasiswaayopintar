
CREATE POLICY "Anyone can view submission by token_id"
ON public.scholarship_submissions
FOR SELECT
USING (true);
