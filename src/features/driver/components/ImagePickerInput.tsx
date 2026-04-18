/**
 * ImagePickerInput Component
 * Reusable image picker input component for forms
 * Shows preview, upload progress, and handles errors
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Camera, Upload, X, CheckCircle } from 'lucide-react-native';
import { useImagePickerUpload } from '../hooks/useImagePickerUpload';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import type { UploadedImage } from '../../../services/imageUploadService';

export interface ImagePickerInputProps {
  label: string;
  sublabel?: string;
  userId: string;
  bucketType: 'DRIVER_LICENSES' | 'DRIVER_PROFILES' | 'DRIVER_NIN_SLIPS' | 'PASSENGER_PROFILES' | 'VEHICLE_DOCUMENTS';
  value?: string; // Current image URL or path
  onImageSelected?: (downloadUrl: string, imageData: UploadedImage) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  maxImageFileSize?: number; // bytes
  allowedTypes?: string[]; // MIME types
}

export const ImagePickerInput = React.forwardRef<View, ImagePickerInputProps>(
  (
    {
      label,
      sublabel,
      userId,
      bucketType,
      value,
      onImageSelected,
      onError,
      disabled = false,
      maxImageFileSize,
      allowedTypes,
    },
    ref
  ) => {
    const {
      image,
      isLoading,
      error,
      progress,
      pickAndUploadImage,
      clearError,
      resetImage,
    } = useImagePickerUpload(userId, bucketType, {
      maxImageFileSize,
      allowedTypes,
      onSuccess: (imageData) => {
        onImageSelected?.(imageData.downloadUrl, imageData);
      },
      onError: (errorMsg) => {
        onError?.(errorMsg);
      },
    });

    const displayUrl = image?.downloadUrl || value;
    const hasImage = !!displayUrl && !error;
    const missingUserId = !userId?.trim();
    const isDisabledDueToAuth = disabled || missingUserId;

    useEffect(() => {
      if (error && onError) {
        onError(error);
      }
    }, [error, onError]);

    const handleClearImage = () => {
      resetImage();
      onImageSelected?.('', null as any);
    };

    return (
      <View ref={ref} style={styles.container}>
        {/* Label */}
        <View style={styles.labelContainer}>
          <AppText variant="sm" style={styles.label}>
            {label}
          </AppText>
          {sublabel && (
            <AppText variant="xs" style={styles.sublabel}>
              {sublabel}
            </AppText>
          )}
        </View>

        {/* Image Preview or Placeholder */}
        <View style={styles.imageContainer}>
          {hasImage ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: displayUrl }} style={styles.image} />
              {!isLoading && (
                <View style={styles.imageOverlay}>
                  <Pressable
                    style={styles.removeButtonContent}
                    onPress={handleClearImage}
                    disabled={disabled || isLoading}
                  >
                    <X size={20} color="#FF4444" strokeWidth={2} />
                  </Pressable>
                </View>
              )}
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              {isLoading ? (
                <View style={styles.centeredContent}>
                  <ActivityIndicator size="large" color="#666" />
                  <AppText variant="sm" style={styles.uploadingText}>
                    Uploading... {progress?.progress.toFixed(0)}%
                  </AppText>
                </View>
              ) : (
                <View style={styles.centeredContent}>
                  <Upload size={40} color="#999" strokeWidth={1.5} />
                  <AppText variant="sm" style={styles.placeholderText}>
                    No image selected
                  </AppText>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <AppButton
            title="Pick from Gallery"
            variant="secondary"
            style={styles.button}
            disabled={isDisabledDueToAuth || isLoading}
            onPress={() => pickAndUploadImage('library')}
          />
          <AppButton
            title="Take Photo"
            variant="secondary"
            style={styles.button}
            disabled={isDisabledDueToAuth || isLoading}
            onPress={() => pickAndUploadImage('camera')}
          />
        </View>

        {/* Authentication Error Message */}
        {missingUserId && (
          <View style={styles.errorContainer}>
            <AppText variant="xs" style={styles.errorText}>
              Please complete authentication to upload images
            </AppText>
          </View>
        )}

        {/* Firebase Storage Configuration Error Message */}
        {error?.includes('object-not-found') && (
          <View style={styles.warningContainer}>
            <AppText variant="xs" style={styles.warningText}>
              Storage configuration needed. See FIREBASE_STORAGE_SETUP.md for setup instructions.
            </AppText>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <AppText variant="xs" style={styles.errorText}>
              {error}
            </AppText>
            <Pressable onPress={clearError}>
              <AppText variant="xs" style={styles.closeErrorButton}>
                Close
              </AppText>
            </Pressable>
          </View>
        )}

        {/* Success Indicator */}
        {hasImage && !isLoading && (
          <View style={styles.successContainer}>
            <CheckCircle size={16} color="#4CAF50" strokeWidth={2} />
            <AppText variant="xs" style={styles.successText}>
              Image uploaded successfully
            </AppText>
          </View>
        )}

        {/* Progress Bar */}
        {isLoading && progress && progress.progress < 100 && (
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${progress.progress}%` },
              ]}
            />
          </View>
        )}
      </View>
    );
  }
);

ImagePickerInput.displayName = 'ImagePickerInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelContainer: {
    marginBottom: 10,
  },
  label: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sublabel: {
    color: '#999',
    fontStyle: 'italic',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 3,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 12,
  },
  removeButtonContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#999',
    marginTop: 8,
  },
  uploadingText: {
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  button: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#C62828',
    flex: 1,
    marginRight: 8,
  },
  closeErrorButton: {
    color: '#C62828',
    fontWeight: '600',
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  warningText: {
    color: '#E65100',
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    color: '#2E7D32',
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
});
