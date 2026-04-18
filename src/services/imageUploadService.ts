/**
 * Firebase Storage Image Upload Service
 * Handles all image upload operations with download URL generation
 */

import storage from '@react-native-firebase/storage';

export type UploadProgress = {
  progress: number; // 0-100
  bytesTransferred: number;
  totalBytes: number;
};

/**
 * Represents an uploaded image with metadata
 */
export type UploadedImage = {
  downloadUrl: string;
  fileName: string;
  path: string;
  uploadedAt: string; // ISO timestamp
};

const STORAGE_BUCKETS = {
  DRIVER_LICENSES: 'driver-documents/driver-licenses',
  DRIVER_PROFILES: 'driver-documents/profile-photos',
  DRIVER_NIN_SLIPS: 'driver-documents/nin-slips',
  PASSENGER_PROFILES: 'passenger-documents/profile-photos',
  VEHICLE_DOCUMENTS: 'vehicle-documents',
} as const;

type BucketKey = keyof typeof STORAGE_BUCKETS;

/**
 * Gets the appropriate storage path for a document type
 */
function getStoragePath(bucketType: BucketKey, userId: string, fileName: string): string {
  const bucket = STORAGE_BUCKETS[bucketType];
  const pathParts = bucket.split('/').filter(Boolean);
  const root = pathParts.shift();
  const nestedFolder = pathParts.join('/');
  const timestamp = Date.now();
  // Put userId directly under the root folder to align with common security rules:
  // Example: driver-documents/user123/driver-licenses/1234567890_license.jpg
  if (!root) {
    throw new Error(`Invalid storage bucket path for ${bucketType}`);
  }

  const basePath = `${root}/${userId}`;
  return nestedFolder
    ? `${basePath}/${nestedFolder}/${timestamp}_${fileName}`
    : `${basePath}/${timestamp}_${fileName}`;
}

/**
 * Generates a unique file name from original file name
 */
function generateFileName(originalFileName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const extension = originalFileName.split('.').pop() || 'jpg';
  return `${timestamp}_${random}.${extension}`;
}

/**
 * Uploads a single image to Firebase Storage
 * @param uri - File URI from image picker
 * @param bucketType - Storage bucket type (DRIVER_LICENSES, DRIVER_PROFILES, etc)
 * @param userId - User ID (for organizing documents)
 * @param onProgress - Optional callback for upload progress
 * @returns Downloaded image data with URL
 */
export const uploadImageToFirebase = async (
  uri: string,
  bucketType: BucketKey,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadedImage> => {
  try {
    if (!uri) {
      throw new Error('Image URI is required');
    }

    if (!userId?.trim()) {
      throw new Error('Authenticated user ID is required for image upload');
    }

    console.log('[ImageUploadService] Starting upload', { uri, bucketType, userId });

    // Extract filename from URI
    const fileName = uri.split('/').pop() || 'image.jpg';
    const generatedFileName = generateFileName(fileName);
    const storagePath = getStoragePath(bucketType, userId.trim(), generatedFileName);

    console.log('[ImageUploadService] Storage path generated', { storagePath });

    // Reference the storage location
    const storageRef = storage().ref(storagePath);

    // Upload file using Cloud Storage's built-in mechanism
    // For React Native, we use putFile directly
    const task = storageRef.putFile(uri);

    // Track upload progress
    const unsubscribe = task.on('state_changed', (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log('[ImageUploadService] Upload progress', { progress, bytesTransferred: snapshot.bytesTransferred, totalBytes: snapshot.totalBytes });
      onProgress?.({
        progress,
        bytesTransferred: snapshot.bytesTransferred,
        totalBytes: snapshot.totalBytes,
      });
    });

    // Wait for upload to complete
    let uploadSnapshot;
    try {
      uploadSnapshot = await task;
      console.log('[ImageUploadService] Upload completed', { uploadSnapshot });
    } catch (uploadError) {
      unsubscribe?.();
      console.error('[ImageUploadService] Upload task failed', {
        error: uploadError instanceof Error ? uploadError.message : String(uploadError),
        code: uploadError instanceof Object && 'code' in uploadError ? (uploadError as any).code : 'UNKNOWN',
      });
      throw uploadError;
    }

    unsubscribe?.();

    // Verify upload was successful
    if (!uploadSnapshot) {
      throw new Error('Upload completed but no confirmation from server');
    }

    console.log('[ImageUploadService] Upload verified, fetching download URL');

    // Use uploaded metadata path when available to avoid reference drift.
    const uploadedPath = uploadSnapshot?.metadata?.fullPath || storagePath;
    const uploadedFileRef = storage().ref(uploadedPath);

    // Get the download URL with retry logic in case of timing issues
    let downloadUrl: string | null = null;
    let retryCount = 0;
    const maxRetries = 6;
    
    while (!downloadUrl && retryCount < maxRetries) {
      try {
        console.log('[ImageUploadService] Attempting to get download URL', { attempt: retryCount + 1 });
        downloadUrl = await uploadedFileRef.getDownloadURL();
        console.log('[ImageUploadService] Download URL obtained', { downloadUrl });
        break;
      } catch (err) {
        retryCount++;
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn('[ImageUploadService] Failed to get download URL', { 
          attempt: retryCount,
          error: errorMsg,
          code: err instanceof Object && 'code' in err ? (err as any).code : 'UNKNOWN',
        });
        
        if (retryCount >= maxRetries) {
          throw err;
        }
        // Wait before retrying (500ms -> 3000ms)
        await new Promise<void>(resolve => setTimeout(resolve, 500 * retryCount));
      }
    }

    if (!downloadUrl) {
      throw new Error('Failed to get download URL after retries');
    }

    return {
      downloadUrl,
      fileName: generatedFileName,
      path: storagePath,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code?: unknown }).code ?? '')
        : '';
    console.error('[ImageUploadService] Error uploading image to Firebase:', {
      error: errorMessage,
      code: errorCode || (error instanceof Object && 'code' in error ? (error as any).code : undefined),
    });

    if (
      errorCode.includes('object-not-found') ||
      errorMessage.includes('object-not-found')
    ) {
      throw new Error(
        'Upload reached Firebase but the file could not be read back. Check Storage rules for path pattern: driver-documents/{userId}/..., passenger-documents/{userId}/..., vehicle-documents/{userId}/....'
      );
    }

    if (
      errorCode.includes('unauthorized') ||
      errorMessage.includes('unauthorized')
    ) {
      throw new Error(
        'Upload blocked by Firebase Storage rules. Ensure authenticated users can read/write their own folder paths.'
      );
    }

    throw new Error(errorMessage || 'Failed to upload image. Please try again.');
  }
};

/**
 * Uploads multiple images in parallel
 * @param uploads - Array of {uri, bucketType, userId}
 * @param onProgress - Optional callback for overall progress
 * @returns Array of uploaded image data
 */
export const uploadMultipleImages = async (
  uploads: Array<{
    uri: string;
    bucketType: BucketKey;
    userId: string;
  }>,
  onProgress?: (completed: number, total: number) => void
): Promise<UploadedImage[]> => {
  const results: UploadedImage[] = [];

  for (let i = 0; i < uploads.length; i++) {
    const { uri, bucketType, userId } = uploads[i];

    try {
      const result = await uploadImageToFirebase(uri, bucketType, userId);
      results.push(result);
      onProgress?.(i + 1, uploads.length);
    } catch (error) {
      console.error(`Error uploading image ${i + 1}:`, error);
      throw error;
    }
  }

  return results;
};

/**
 * Deletes an image from Firebase Storage
 * @param imageUrl - Download URL or storage path
 */
export const deleteImageFromFirebase = async (imageUrl: string): Promise<void> => {
  try {
    // If it's a download URL, we need to decode it and find the path
    // For now, assume it's a direct path reference
    const storageRef = storage().refFromURL(imageUrl);
    await storageRef.delete();
  } catch (error) {
    console.error('Error deleting image from Firebase:', error);
    throw new Error('Failed to delete image');
  }
};

/**
 * Gets download URL for an existing storage path
 * @param storagePath - The full storage path
 */
export const getDownloadUrl = async (storagePath: string): Promise<string> => {
  try {
    const storageRef = storage().ref(storagePath);
    
    let downloadUrl: string | null = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!downloadUrl && retryCount < maxRetries) {
      try {
        downloadUrl = await storageRef.getDownloadURL();
        break;
      } catch (err) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw err;
        }
        // Wait before retrying (exponential backoff: 500ms, 1000ms, 1500ms)
        await new Promise<void>(resolve => setTimeout(resolve, 500 * retryCount));
      }
    }
    
    if (!downloadUrl) {
      throw new Error('Failed to retrieve download URL after retries');
    }
    
    return downloadUrl;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[ImageUploadService] Error getting download URL:', {
      error: errorMessage,
      storagePath,
    });
    throw new Error('Failed to retrieve image URL');
  }
};

export const ImageUploadBuckets = STORAGE_BUCKETS;
