DROP POLICY IF EXISTS "Admins can update submissions" ON public.scholarship_submissions;

CREATE POLICY "Admins and staff can update submissions"
ON public.scholarship_submissions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));