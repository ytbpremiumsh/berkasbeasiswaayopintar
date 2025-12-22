-- Fix storage policy to allow public uploads with folder prefix
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;

CREATE POLICY "Anyone can upload to public folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'scholarship-documents' 
  AND (storage.foldername(name))[1] = 'public'
);

-- Remove foreign key constraint on user_id since we use session IDs for anonymous users
ALTER TABLE public.scholarship_submissions 
DROP CONSTRAINT IF EXISTS scholarship_submissions_user_id_fkey;