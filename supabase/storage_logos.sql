-- Step 1: Add logo_url column to businesses table
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Step 2: Create storage bucket for logos
-- You need to do this in Supabase Dashboard > Storage:
-- 1. Click "New Bucket"
-- 2. Name: "logos"
-- 3. Public bucket: YES (check the box)
-- 4. Click "Create bucket"

-- Step 3: Set up storage policies for the logos bucket
-- Run this in SQL Editor after creating the bucket:

-- Allow authenticated users to upload logos to their own business folder
CREATE POLICY "Users can upload logos to their business folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Allow authenticated users to update logos in their business folder
CREATE POLICY "Users can update their business logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Allow authenticated users to delete logos from their business folder
CREATE POLICY "Users can delete their business logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Allow public read access to all logos
CREATE POLICY "Anyone can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');
