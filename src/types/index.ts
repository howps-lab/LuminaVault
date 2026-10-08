export interface Photo {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
  signedUrl?: string; // Client-side cached signed URL for private bucket
}

export type UploadStatus = 'pending' | 'uploading' | 'saving_metadata' | 'success' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: UploadStatus;
  errorMessage?: string;
  width: number | null;
  height: number | null;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isCustom: boolean;
}

export type GallerySortBy = 'newest' | 'oldest' | 'largest' | 'smallest' | 'name';
