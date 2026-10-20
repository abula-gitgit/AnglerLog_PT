import { StoredPhoto } from '../types/fishing';
import { savePhoto, getPhotosByIds, deletePhoto } from './db';

// Compress image to ensure smooth storage in IndexedDB
export async function processAndAutoSavePhoto(
  file: File,
  association?: { spotId?: string; catchLogId?: string; caption?: string }
): Promise<StoredPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        try {
          // Limit max dimension to 1920px for high clarity while keeping size reasonable (~200KB-800KB)
          const MAX_DIM = 1920;
          let width = img.width;
          let height = img.height;

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas 2D context unavailable');

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

          const photoRecord: StoredPhoto = {
            id: 'photo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
            dataUrl,
            fileName: file.name,
            fileSize: Math.round((dataUrl.length * 3) / 4),
            mimeType: 'image/jpeg',
            capturedAt: new Date(file.lastModified || Date.now()).toISOString(),
            spotId: association?.spotId,
            catchLogId: association?.catchLogId,
            caption: association?.caption || file.name.replace(/\.[^/.]+$/, ''),
          };

          // Save automatically to IndexedDB
          await savePhoto(photoRecord);
          resolve(photoRecord);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export { getPhotosByIds, deletePhoto };
