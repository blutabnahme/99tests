-- Migration: 034_avatar_columns_and_storage.sql
-- Description: Adds avatar_url columns to blood_collector and healthcare_company tables, and creates public 'avatars' storage bucket.

ALTER TABLE blood_collector ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;
ALTER TABLE healthcare_company ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;

-- Create the avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload their own avatar
-- Ensure the user can only insert into their own folder (bc/USER_ID.jpg or hc/USER_ID.jpg)
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- Policy: Anyone can view avatars  
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'avatars');
