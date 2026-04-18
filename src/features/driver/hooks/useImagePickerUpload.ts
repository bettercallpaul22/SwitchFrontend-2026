/**
 * useImagePickerUpload Hook
 * Reusable hook for picking images and uploading to Firebase Storage
 * Can be used globally across the app for any image upload need
 */

import { useState, useCallback } from 'react';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import type { ImagePickerResponse } from 'react-native-image-picker';
import {
  uploadImageToFirebase,
  type UploadProgress,
  type UploadedImage,
  ImageUploadBuckets,
} from '../../../services/imageUploadService';

export type ImagePickerSource = 'camera' | 'library';

/**
 * Hook return type
 */
export type UseImagePickerUploadReturn = {
  image: UploadedImage | null;
  isLoading: boolean;
  error: string | null;
  progress: UploadProgress | null;
  pickAndUploadImage: (source: ImagePickerSource) => Promise<void>;
  pickImage: (source: ImagePickerSource) => Promise<void>;
  clearError: () => void;
  resetImage: () => void;
};

/**
 * Hook for picking and uploading images
 * @param userId - User ID for organizing uploaded images
 * @param bucketType - Storage bucket type (e.g., 'DRIVER_LICENSES', 'DRIVER_PROFILES')
 * @param options - Optional configuration
 * @returns Hook state and functions
 *
 * @example
 * const { image, isLoading, error, pickAndUploadImage } = useImagePickerUpload(
 *   userId,
 *   'DRIVER_PROFILES'
 * );
 *
 * useEffect(() => {
 *   if (image?.downloadUrl) {
 *     setProfilePhoto(image.downloadUrl);
 *   }
 * }, [image?.downloadUrl]);
 */
export function useImagePickerUpload(
  userId: string,
  bucketType: keyof typeof ImageUploadBuckets,
  options?: {
    maxImageFileSize?: number; // bytes, default 5MB
    allowedTypes?: string[]; // MIME types, default ['image/jpeg', 'image/png', 'image/webp']
    onSuccess?: (image: UploadedImage) => void;
    onError?: (error: string) => void;
  }
): UseImagePickerUploadReturn {
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const maxSize = options?.maxImageFileSize ?? DEFAULT_MAX_SIZE;
  const allowedTypes = options?.allowedTypes ?? DEFAULT_ALLOWED_TYPES;

  /**
   * Validates image before upload
   */
  const validateImage = (response: ImagePickerResponse): string | null => {
    if (response.didCancel) {
      return null; // User cancelled, not an error
    }

    if (response.errorCode) {
      return `Image picker error: ${response.errorMessage || response.errorCode}`;
    }

    if (!response.assets || response.assets.length === 0) {
      return 'No image selected';
    }

    const asset = response.assets[0];

    // Validate file size
    if (asset.fileSize && asset.fileSize > maxSize) {
      return `Image size must be less than ${maxSize / 1024 / 1024}MB`;
    }

    // Validate file type
    const mimeType = asset.type;
    if (mimeType && !allowedTypes.includes(mimeType)) {
      return `Only these formats are allowed: ${allowedTypes.join(', ')}`;
    }

    return null;
  };

  /**
   * Picks an image without uploading
   * Useful if you need to preview before uploading
   */
  const pickImage = useCallback(
    async (source: ImagePickerSource) => {
      setError(null);

      try {
        const launcher = source === 'camera' ? launchCamera : launchImageLibrary;
        const response = await new Promise<ImagePickerResponse>((resolve) => {
          launcher(
            {
              mediaType: 'photo',
              selectionLimit: 1,
              quality: 0.8,
              cameraType: 'back',
            },
            (result: ImagePickerResponse) => resolve(result)
          );
        });

        const validationError = validateImage(response);
        if (validationError) {
          setError(validationError);
          options?.onError?.(validationError);
          return;
        }

        if (response.assets && response.assets[0].uri) {
          // Store URI for later upload if needed
          setImage((prev: any) => ({
            ...prev,
            path: response.assets![0].uri!,
          } as any));
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to pick image';
        setError(errorMsg);
        options?.onError?.(errorMsg);
      }
    },
    [maxSize, allowedTypes, options]
  );

  /**
   * Picks an image and immediately uploads to Firebase
   */
  const pickAndUploadImage = useCallback(
    async (source: ImagePickerSource) => {
      setError(null);
      setProgress(null);

      try {
        const launcher = source === 'camera' ? launchCamera : launchImageLibrary;

        const response = await new Promise<ImagePickerResponse>((resolve) => {
          launcher(
            {
              mediaType: 'photo',
              selectionLimit: 1,
              quality: 0.8,
              cameraType: 'back',
            },
            (result: ImagePickerResponse) => resolve(result)
          );
        });

        const validationError = validateImage(response);
        if (validationError) {
          if (validationError.includes('cancelled')) {
            // User cancelled, not an error to display
            return;
          }
          setError(validationError);
          options?.onError?.(validationError);
          return;
        }

        if (!response.assets || !response.assets[0].uri) {
          setError('No image URI available');
          return;
        }

        setIsLoading(true);
        const uploadedImage = await uploadImageToFirebase(
          response.assets[0].uri,
          bucketType as keyof typeof ImageUploadBuckets,
          userId,
          (progressUpdate: UploadProgress) => {
            setProgress(progressUpdate);
          }
        );

        setImage(uploadedImage);
        options?.onSuccess?.(uploadedImage);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to upload image';
        setError(errorMsg);
        options?.onError?.(errorMsg);
      } finally {
        setIsLoading(false);
        setProgress(null);
      }
    },
    [userId, bucketType, options]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetImage = useCallback(() => {
    setImage(null);
    setError(null);
    setProgress(null);
  }, []);

  return {
    image,
    isLoading,
    error,
    progress,
    pickAndUploadImage,
    pickImage,
    clearError,
    resetImage,
  };
}
