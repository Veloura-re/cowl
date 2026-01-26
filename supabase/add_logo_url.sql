-- Add logo_url column to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create storage bucket for logos (run this in Supabase Dashboard > Storage)
-- Bucket name: logos
-- Public: true
-- File size limit: 2MB
-- Allowed MIME types: image/png, image/jpeg, image/jpg, image/svg+xml
