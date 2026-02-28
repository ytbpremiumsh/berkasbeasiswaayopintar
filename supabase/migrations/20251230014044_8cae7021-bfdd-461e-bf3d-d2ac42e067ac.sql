-- Allow staff to update submission status
CREATE POLICY "Staff can update submissions"
ON public.scholarship_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'staff'::app_role));