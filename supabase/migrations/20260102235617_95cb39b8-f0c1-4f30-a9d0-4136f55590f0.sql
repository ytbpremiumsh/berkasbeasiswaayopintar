-- Add institution_name column to scholarship_submissions
ALTER TABLE public.scholarship_submissions 
ADD COLUMN institution_name text;