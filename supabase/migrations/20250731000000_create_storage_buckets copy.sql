-- Migration to create storage buckets and define access policies.

-- 1. Create the 'outfit-images' bucket for user-specific, private images.
-- This bucket is private, and access is controlled by RLS policies.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('outfit-images', 'outfit-images', FALSE, 52428800, ARRAY['image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- 2. Create the 'blogs' bucket for public images used in blog posts.
-- This bucket is public, allowing universal read access via the public URL.
INSERT INTO storage.buckets (id, name, public)
VALUES ('blogs', 'blogs', TRUE)
ON CONFLICT (id) DO NOTHING;



-- Policy: Allow users to view images in their own folder.
CREATE POLICY "Allow authenticated users to view their own images"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'outfit-images' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Policy: Allow users to upload new images into their own folder.
CREATE POLICY "Allow authenticated users to upload to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'outfit-images' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Policy: Allow users to update images in their own folder.
CREATE POLICY "Allow authenticated users to update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'outfit-images' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Policy: Allow users to delete images from their own folder.
CREATE POLICY "Allow authenticated users to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'outfit-images' AND (storage.foldername(name))[1] = auth.uid()::text );


/********************************************************************************
 * POLICIES FOR 'blogs' BUCKET
 *
 * Description:
 * This bucket is public. The policy here allows authenticated users to list
 * files via the API. Write and delete permissions are intentionally omitted,
 * effectively making the bucket read-only for all users except those with
 * the service_role key.
 ********************************************************************************/

-- Drop existing policy to ensure consistency
DROP POLICY IF EXISTS "Allow authenticated read access on blogs bucket" ON storage.objects;

-- Policy: Allow authenticated users to list and view blog images via the API.
-- Because the bucket is public, anyone can access images via the public URL.
CREATE POLICY "Allow authenticated read access on blogs bucket"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'blogs' );