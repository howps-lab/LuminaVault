import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Photo } from '../types';
import { getMockPhotos, saveMockPhotos } from './mockStorage';

const LOCAL_STORAGE_URL_KEY = 'lumina_supabase_url';
const LOCAL_STORAGE_ANON_KEY = 'lumina_supabase_anon_key';

export function getActiveSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean; isCustom: boolean } {
  const customUrl = localStorage.getItem(LOCAL_STORAGE_URL_KEY)?.trim() || '';
  const customKey = localStorage.getItem(LOCAL_STORAGE_ANON_KEY)?.trim() || '';

  if (customUrl && customKey) {
    return { url: customUrl, anonKey: customKey, isConfigured: true, isCustom: true };
  }

  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const isConfigured = Boolean(envUrl && envKey && !envUrl.includes('your-project-id'));
  return {
    url: envUrl,
    anonKey: envKey,
    isConfigured,
    isCustom: false,
  };
}

let supabaseInstance: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getActiveSupabaseCredentials();

  if (!isConfigured) {
    return null;
  }

  if (supabaseInstance && currentUrl === url && currentKey === anonKey) {
    return supabaseInstance;
  }

  try {
    currentUrl = url;
    currentKey = anonKey;
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

export function setCustomCredentials(url: string, anonKey: string): void {
  localStorage.setItem(LOCAL_STORAGE_URL_KEY, url.trim());
  localStorage.setItem(LOCAL_STORAGE_ANON_KEY, anonKey.trim());
  supabaseInstance = null; // force reinit
}

export function clearCustomCredentials(): void {
  localStorage.removeItem(LOCAL_STORAGE_URL_KEY);
  localStorage.removeItem(LOCAL_STORAGE_ANON_KEY);
  supabaseInstance = null;
}

// Verification test query
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const testClient = createClient(url, anonKey);
    // Simple ping to check if URL & Anon Key reach Supabase API
    const { error } = await testClient.from('photos').select('id').limit(1);

    // If table doesn't exist yet, postgres returns code 42P01 ("relation photos does not exist")
    // but the connection and authentication themselves succeeded!
    if (error) {
      if (error.code === '42P01' || error.message.includes('relation "public.photos" does not exist')) {
        return {
          success: true,
          message: 'Connected to Supabase! (Note: The "photos" table is not created yet; run the SQL schema to create it).',
        };
      }
      if (error.code === 'PGRST301' || error.message.includes('JWT') || error.message.includes('apikey')) {
        return { success: false, message: 'Invalid Anon Key or authentication rejected: ' + error.message };
      }
      // Any generic error check
      return { success: true, message: `Connected to Supabase API (API response: ${error.message})` };
    }

    return { success: true, message: 'Successfully connected and verified access to the "photos" table!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed. Please verify your Project URL.' };
  }
}

// Fetch photos for the authenticated user
export async function fetchPhotos(user: User | null): Promise<Photo[]> {
  const client = getSupabase();

  if (!client || !user) {
    // Return mock demo photos
    return getMockPhotos();
  }

  // Real Supabase query: Row Level Security will ensure only user's photos are returned
  const { data, error } = await client
    .from('photos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching photos from Supabase:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Create signed URLs for all images from the private bucket
  // Supabase createSignedUrls accepts an array of paths
  const filePaths = data.map((item) => item.file_path);
  
  try {
    const { data: signedUrlsData, error: signedError } = await client.storage
      .from('photos')
      .createSignedUrls(filePaths, 3600); // 1 hour expiration

    const signedUrlMap: Record<string, string> = {};
    if (!signedError && signedUrlsData) {
      signedUrlsData.forEach((s) => {
        if (s.signedUrl && s.path) {
          signedUrlMap[s.path] = s.signedUrl;
        }
      });
    }

    return data.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      file_path: row.file_path,
      file_name: row.file_name,
      file_size: Number(row.file_size),
      mime_type: row.mime_type,
      width: row.width ? Number(row.width) : null,
      height: row.height ? Number(row.height) : null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      signedUrl: signedUrlMap[row.file_path] || undefined,
    }));
  } catch (urlErr) {
    console.warn('Could not generate batch signed URLs, falling back to rows:', urlErr);
    return data;
  }
}

// Get single signed URL if needed
export async function getSignedUrl(filePath: string): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client.storage.from('photos').createSignedUrl(filePath, 3600);
  if (error || !data?.signedUrl) {
    console.error('Failed to get signed URL for', filePath, error);
    return null;
  }
  return data.signedUrl;
}

// Upload a single photo to Supabase Storage and Postgres
export async function uploadSinglePhoto({
  user,
  file,
  width,
  height,
  onProgress,
}: {
  user: User | null;
  file: File;
  width: number | null;
  height: number | null;
  onProgress?: (progress: number) => void;
}): Promise<Photo> {
  const client = getSupabase();

  if (!client || !user) {
    // Simulated upload for demo mode
    for (let p = 10; p <= 90; p += 20) {
      onProgress?.(p);
      await new Promise((r) => setTimeout(r, 60));
    }
    onProgress?.(100);

    const objectUrl = URL.createObjectURL(file);
    const mockId = 'demo-' + crypto.randomUUID();
    const newPhoto: Photo = {
      id: mockId,
      user_id: 'demo-user-id',
      file_path: `demo-user-id/${mockId}-${file.name}`,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || 'image/jpeg',
      width: width || 1920,
      height: height || 1080,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      signedUrl: objectUrl,
    };

    const currentList = getMockPhotos();
    saveMockPhotos([newPhoto, ...currentList]);
    return newPhoto;
  }

  // 1. Generate collision-safe naming: {user_id}/{uuid}-{sanitizedName}
  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanBaseName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  const uniqueName = `${crypto.randomUUID()}-${cleanBaseName}.${fileExt}`;
  const filePath = `${user.id}/${uniqueName}`;

  onProgress?.(15);

  // 2. Upload file to Supabase Storage private bucket 'photos'
  const { error: uploadError } = await client.storage.from('photos').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  onProgress?.(70);

  // 3. Insert record into Postgres 'photos' table
  const photoId = crypto.randomUUID();
  const insertPayload = {
    id: photoId,
    user_id: user.id,
    file_path: filePath,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type || 'image/jpeg',
    width: width ?? null,
    height: height ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: dbData, error: dbError } = await client
    .from('photos')
    .insert(insertPayload)
    .select()
    .single();

  if (dbError) {
    // CRITICAL CLEANUP: If database insert fails after file uploaded, remove orphaned storage file!
    console.warn('Database insert failed. Cleaning up orphaned storage file:', filePath);
    try {
      await client.storage.from('photos').remove([filePath]);
    } catch (cleanupErr) {
      console.error('Failed to cleanup orphaned storage file:', cleanupErr);
    }
    throw new Error(`Database record failed: ${dbError.message}`);
  }

  onProgress?.(90);

  // 4. Generate signed URL for immediate display
  const { data: signedData } = await client.storage.from('photos').createSignedUrl(filePath, 3600);

  onProgress?.(100);

  return {
    id: dbData.id,
    user_id: dbData.user_id,
    file_path: dbData.file_path,
    file_name: dbData.file_name,
    file_size: Number(dbData.file_size),
    mime_type: dbData.mime_type,
    width: dbData.width ? Number(dbData.width) : null,
    height: dbData.height ? Number(dbData.height) : null,
    created_at: dbData.created_at,
    updated_at: dbData.updated_at,
    signedUrl: signedData?.signedUrl || undefined,
  };
}

// Delete photo from both Storage and Database
export async function deletePhoto(photo: Photo, user: User | null): Promise<void> {
  const client = getSupabase();

  if (!client || !user) {
    // Demo mode: delete from mock store
    const currentList = getMockPhotos();
    const updated = currentList.filter((p) => p.id !== photo.id);
    saveMockPhotos(updated);
    return;
  }

  // 1. Delete file from Supabase Storage
  const { error: storageError } = await client.storage.from('photos').remove([photo.file_path]);
  if (storageError) {
    console.warn('Warning: Storage file deletion returned error:', storageError.message);
    // Proceed to database deletion so user can still clear the database record
  }

  // 2. Delete record from photos table
  const { error: dbError } = await client.from('photos').delete().eq('id', photo.id);
  if (dbError) {
    throw new Error(`Failed to delete photo record from database: ${dbError.message}`);
  }
}
