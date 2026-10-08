-- ==============================================================================
-- LUMINA VAULT: SUPABASE DATABASE & STORAGE SCHEMA
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- ==============================================================================

-- 1. Create the photos table
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Performance indexes for user lookups and timeline sorting
CREATE INDEX IF NOT EXISTS photos_user_id_idx ON public.photos(user_id);
CREATE INDEX IF NOT EXISTS photos_created_at_idx ON public.photos(created_at DESC);

-- 3. Enable Row Level Security (RLS) on public.photos
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running migration
DROP POLICY IF EXISTS "Users can view their own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can insert their own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON public.photos;

-- RLS Policies: strict user isolation
CREATE POLICY "Users can view their own photos"
    ON public.photos FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own photos"
    ON public.photos FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos"
    ON public.photos FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos"
    ON public.photos FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 4. Create or configure the private 'photos' storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'photos',
    'photos',
    false, -- Private bucket: Requires signed URLs for viewing
    10485760, -- 10MB file limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif'];

-- 5. Storage policies for the 'photos' bucket ({user_id}/{filename})
DROP POLICY IF EXISTS "Allow users to upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own photos" ON storage.objects;

-- Insert policy: authenticated users can only upload files into photos/{auth.uid()}/...
CREATE POLICY "Allow users to upload to their own folder"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Select policy: authenticated users can only view their own photos
CREATE POLICY "Allow users to view their own photos"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Update policy: authenticated users can only update their own photos
CREATE POLICY "Allow users to update their own photos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Delete policy: authenticated users can only delete their own photos
CREATE POLICY "Allow users to delete their own photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
