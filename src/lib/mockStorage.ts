import { Photo } from '../types';

// Initial sample images generated for demo mode
import sampleMountain from '../assets/images/photo_sample_mountain_1791427960597.jpg';
import sampleArch from '../assets/images/photo_sample_architecture_1791427971823.jpg';
import sampleOcean from '../assets/images/photo_sample_ocean_1791427982366.jpg';

const STORAGE_KEY = 'lumina_demo_photos_v1';

export const INITIAL_DEMO_PHOTOS: Photo[] = [
  {
    id: 'demo-photo-1',
    user_id: 'demo-user-id',
    file_path: 'demo-user-id/mountain-golden-hour.jpg',
    file_name: 'Alpine Ridge Dawn.jpg',
    file_size: 2450800,
    mime_type: 'image/jpeg',
    width: 2560,
    height: 1920,
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    signedUrl: sampleMountain,
  },
  {
    id: 'demo-photo-2',
    user_id: 'demo-user-id',
    file_path: 'demo-user-id/architectural-curves.jpg',
    file_name: 'Minimalist Architecture.jpg',
    file_size: 1845200,
    mime_type: 'image/jpeg',
    width: 2048,
    height: 1536,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    signedUrl: sampleArch,
  },
  {
    id: 'demo-photo-3',
    user_id: 'demo-user-id',
    file_path: 'demo-user-id/ocean-crashing-rocks.jpg',
    file_name: 'Pacific Basalt Surge.jpg',
    file_size: 3120900,
    mime_type: 'image/jpeg',
    width: 2880,
    height: 2160,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    signedUrl: sampleOcean,
  },
];

export function getMockPhotos(): Photo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_PHOTOS));
      return INITIAL_DEMO_PHOTOS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_PHOTOS;
  }
}

export function saveMockPhotos(photos: Photo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  } catch (e) {
    console.error('Failed to save demo photos to local storage', e);
  }
}
