# Driver Profile Image Upload Implementation Guide

## Overview
This document explains the newly implemented image upload system for driver profile setup. The system provides proper Firebase Storage integration for uploading and managing driver document images globally.

---

## Installation Requirements

### Install react-native-image-picker
The image picker hook requires the `react-native-image-picker` library. Install it with:

```bash
npm install react-native-image-picker
# or
yarn add react-native-image-picker

# For iOS, run pod install
cd ios && pod install && cd ..

# Android configuration
# Add to android/app/src/main/AndroidManifest.xml:
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### Firebase Storage Configuration
Firebase Storage should already be configured in your project. The implementation uses:
- Firebase Storage (`@react-native-firebase/storage` - already in package.json ✅)
- Storage paths organized by document type (driver licenses, profile photos, NIN slips, etc.)

---

## Architecture

### File Structure
```
src/
├── services/
│   └── imageUploadService.ts          # Firebase upload logic
├── features/driver/
│   ├── components/
│   │   └── ImagePickerInput.tsx       # Reusable image picker component
│   ├── hooks/
│   │   └── useImagePickerUpload.ts    # Reusable image picker hook
│   └── screens/
│       └── DriverProfileSetupScreen.tsx # Updated to use new image picker
```

### Core Components

#### 1. **imageUploadService.ts** - Firebase Storage Service
Handles all Firebase Storage operations with organized bucket structure.

**Storage Buckets:**
```
driver-documents/driver-licenses/       # Driver license photos
driver-documents/profile-photos/        # Driver profile photos
driver-documents/nin-slips/             # NIN slip photos
passenger-documents/profile-photos/     # Passenger profile photos (future use)
vehicle-documents/                      # Vehicle-related documents
```

**Key Functions:**
```typescript
// Upload single image
uploadImageToFirebase(
  uri: string,
  bucketType: BucketKey,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadedImage>

// Upload multiple images in parallel
uploadMultipleImages(uploads: Array<...>): Promise<UploadedImage[]>

// Delete image from storage
deleteImageFromFirebase(imageUrl: string): Promise<void>

// Get download URL for stored path
getDownloadUrl(storagePath: string): Promise<string>
```

**Return Type:**
```typescript
type UploadedImage = {
  downloadUrl: string;    // Full Firebase download URL
  fileName: string;       // Generated unique filename
  path: string;          // Storage path
  uploadedAt: string;    // ISO timestamp
};
```

---

#### 2. **useImagePickerUpload.ts** - React Hook
Reusable hook for image selection and Firebase upload with progress tracking.

**Usage:**
```typescript
import { useImagePickerUpload } from './features/driver/hooks/useImagePickerUpload';

const { 
  image,                // Current uploaded image data
  isLoading,            // Upload in progress
  error,                // Error message if any
  progress,             // Upload progress (0-100%)
  pickAndUploadImage,   // Pick and upload immediately
  clearError,           // Clear error state
  resetImage            // Reset image data
} = useImagePickerUpload(
  userId,              // User ID for organizing uploads
  'DRIVER_PROFILES',   // Bucket type
  {
    maxImageFileSize: 5 * 1024 * 1024,  // 5MB limit
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    onSuccess: (image) => { /* handle success */ },
    onError: (error) => { /* handle error */ }
  }
);

// In your component
<AppButton 
  title="Upload Photo"
  onPress={() => pickAndUploadImage('library')} // or 'camera'
/>
```

**Return Type:**
```typescript
type UseImagePickerUploadReturn = {
  image: UploadedImage | null;
  isLoading: boolean;
  error: string | null;
  progress: UploadProgress | null;
  pickAndUploadImage: (source: 'camera' | 'library') => Promise<void>;
  pickImage: (source: 'camera' | 'library') => Promise<void>;
  clearError: () => void;
  resetImage: () => void;
};
```

---

#### 3. **ImagePickerInput.tsx** - Reusable Component
Complete image picker UI component with preview, upload progress, and error handling.

**Usage in Forms:**
```typescript
<ImagePickerInput
  label="Driver's Profile Photo"
  sublabel="Upload a clear, well-lit photo"
  userId={userId}
  bucketType="DRIVER_PROFILES"
  value={currentImageUrl}  // Show existing image
  onImageSelected={(downloadUrl, imageData) => {
    // Update form state with download URL
    setFormData(prev => ({
      ...prev,
      profilePhotoUrl: downloadUrl
    }));
  }}
  onError={(error) => {
    // Handle upload error
    showErrorNotification(error);
  }}
  disabled={isSubmitting}
/>
```

**Props:**
```typescript
interface ImagePickerInputProps {
  label: string;              // Display label
  sublabel?: string;          // Helper text below label
  userId: string;             // User ID (required)
  bucketType: BucketKey;      // Storage bucket type
  value?: string;             // Current image URL or path
  onImageSelected?: (url: string, data: UploadedImage) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  maxImageFileSize?: number;  // bytes, default 5MB
  allowedTypes?: string[];    // MIME types
}
```

---

## Implementation in Driver Profile Setup

### Updated Flow
```
Driver Registration
  ↓
Driver Profile Setup Screen
  ├─ Step 1: Driver Information
  │   ├─ ID Number (text input)
  │   ├─ Driver's License → ImagePickerInput (uploads to Firebase)
  │   ├─ Profile Photo → ImagePickerInput (uploads to Firebase)
  │   ├─ NIN Slip → ImagePickerInput (uploads to Firebase)
  │   └─ Vehicle Details (text inputs)
  │
  └─ Step 2: Preference Selection
      └─ Select earning preference → Submit
```

### Key Changes in DriverProfileSetupScreen.tsx

**Before:**
```typescript
<AppInput
  variant="dark"
  label="Driver's License URL"
  placeholder="https://..."
  value={driverLicenseUrl}
  onChangeText={(value) => setDriverLicenseUrl(value)}
/>
```

**After:**
```typescript
<ImagePickerInput
  label="Driver's License Photo"
  sublabel="Upload a clear photo of your driver's license"
  userId={driverUser?.id || ''}
  bucketType="DRIVER_LICENSES"
  value={driverInformationValues.driverLicenseUrl}
  onImageSelected={(downloadUrl) => 
    onChangeField('driverLicenseUrl', downloadUrl)
  }
  disabled={!driverUser}
/>
```

**Validation Changes:**
- Old: Validated manual URL format (requires `https://...`)
- New: Validates image presence (either from picker upload or manual URL for backward compatibility)
- Images are uploaded automatically and the Firebase download URL is stored

---

## Usage Examples

### Example 1: Basic Profile Photo Upload
```typescript
import { useImagePickerUpload } from '../hooks/useImagePickerUpload';

export function ProfilePhotoUpload() {
  const { image, isLoading, error, pickAndUploadImage } = useImagePickerUpload(
    userId,
    'DRIVER_PROFILES'
  );

  return (
    <View>
      <AppButton
        title="Upload Photo"
        onPress={() => pickAndUploadImage('library')}
        loading={isLoading}
      />
      {image && <Text>Uploaded: {image.downloadUrl}</Text>}
      {error && <Text style={{color: 'red'}}>{error}</Text>}
    </View>
  );
}
```

### Example 2: Form with Multiple Images
```typescript
export function DocumentUploadForm() {
  const [formData, setFormData] = useState({
    driverLicense: '',
    profilePhoto: '',
    ninSlip: ''
  });

  const handleLicenseUpload = (downloadUrl) => {
    setFormData(prev => ({ ...prev, driverLicense: downloadUrl }));
  };

  return (
    <ScrollView>
      <ImagePickerInput
        label="Driver's License"
        userId={userId}
        bucketType="DRIVER_LICENSES"
        onImageSelected={handleLicenseUpload}
      />
      <ImagePickerInput
        label="Profile Photo"
        userId={userId}
        bucketType="DRIVER_PROFILES"
        onImageSelected={(url) => 
          setFormData(prev => ({ ...prev, profilePhoto: url }))
        }
      />
      {/* More inputs... */}
    </ScrollView>
  );
}
```

### Example 3: With Error Handling
```typescript
export function DocumentUpload() {
  const [uploadError, setUploadError] = useState('');

  const { image, isLoading, pickAndUploadImage } = useImagePickerUpload(
    userId,
    'DRIVER_LICENSES',
    {
      maxImageFileSize: 3 * 1024 * 1024, // 3MB max
      allowedTypes: ['image/jpeg', 'image/png'],
      onSuccess: (image) => {
        console.log('Upload successful:', image.downloadUrl);
        setUploadError('');
      },
      onError: (error) => {
        console.error('Upload failed:', error);
        setUploadError(error);
      }
    }
  );

  return (
    <>
      <ImagePickerInput
        label="Document"
        userId={userId}
        bucketType="DRIVER_LICENSES"
        maxImageFileSize={3 * 1024 * 1024}
        onError={setUploadError}
      />
      {uploadError && <ErrorBanner message={uploadError} />}
    </>
  );
}
```

---

## Firebase Storage Rules

Update your Firestore Rules to allow authenticated users to upload to their own documents:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /driver-documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth.uid == userId;
    }
    match /passenger-documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth.uid == userId;
    }
    match /vehicle-documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

## Security & Best Practices

### File Upload Security
1. ✅ Client-side validation (file size, MIME type)
2. ✅ Server-side validation via Firebase Security Rules
3. ✅ User ID isolation (documents organized by user)
4. ✅ File size limit (5MB default, configurable)
5. ✅ Allowed MIME types (JPEG, PNG, WebP)

### Performance
1. ✅ Progress tracking for upload monitoring
2. ✅ Parallel uploads support for multiple images
3. ✅ Automatic file naming with timestamps to prevent collisions
4. ✅ Direct Firebase Storage integration (no backend relay)

### Error Handling
1. ✅ Validation errors (file too large, wrong type)
2. ✅ Network error handling
3. ✅ User-friendly error messages
4. ✅ Retry capability through component UI

---

## Troubleshooting

### Issue: "Cannot find module 'react-native-image-picker'"
**Solution:** Install the package:
```bash
npm install react-native-image-picker
cd ios && pod install && cd ..
```

### Issue: "Permission denied" when uploading
**Android:** Ensure permissions in AndroidManifest.xml
**iOS:** Check Info.plist for camera/photo library permissions

### Issue: Upload times out
**Solution:** Check network connectivity and file size. Firebase free tier has bandwidth limits.

### Issue: Image not appearing after upload
**Solution:** 
1. Check Firebase Storage Rules (see section above)
2. Verify user ID is correct
3. Check download URL format in debugging

---

## Future Enhancements

1. **Image Compression:** Compress images before upload to reduce storage
2. **Thumbnail Generation:** Create thumbnails for profile photos
3. **Batch Operations:** Handle multiple documents upload
4. **Image Validation:** OCR validation for license/NIN documents
5. **Caching:** Local caching of recently uploaded images
6. **Analytics:** Track upload success/failures

---

## API Reference

### imageUploadService.ts

```typescript
// Main upload function
export const uploadImageToFirebase = async (
  uri: string,
  bucketType: 'DRIVER_LICENSES' | 'DRIVER_PROFILES' | 'DRIVER_NIN_SLIPS' | 'PASSENGER_PROFILES' | 'VEHICLE_DOCUMENTS',
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadedImage>

// Delete function
export const deleteImageFromFirebase = async (imageUrl: string): Promise<void>

// Get download URL
export const getDownloadUrl = async (storagePath: string): Promise<string>

// Bulk upload
export const uploadMultipleImages = async (
  uploads: Array<{uri: string; bucketType: BucketKey; userId: string}>,
  onProgress?: (completed: number, total: number) => void
): Promise<UploadedImage[]>

// Export bucket constants
export const ImageUploadBuckets = {
  DRIVER_LICENSES: 'driver-documents/driver-licenses',
  DRIVER_PROFILES: 'driver-documents/profile-photos',
  DRIVER_NIN_SLIPS: 'driver-documents/nin-slips',
  PASSENGER_PROFILES: 'passenger-documents/profile-photos',
  VEHICLE_DOCUMENTS: 'vehicle-documents'
}
```

---

## Testing

To test the image upload functionality:

1. **Manual Testing:**
   - Navigate to driver profile setup screen
   - Try uploading each document type
   - Verify images appear in Firebase Storage console
   - Check download URL in driver document

2. **Error Testing:**
   - Try uploading file > 5MB (should fail)
   - Try uploading non-image file (should fail)
   - Test with network disabled (should show error)

3. **Validation:**
   - Verify Firestore driver document has correct URLs
   - Check Storage Rules allow/deny requests correctly
   - Monitor upload progress in DevTools

---

## Support

For issues or questions:
1. Check Firebase Console for upload logs
2. Review console output for detailed error messages
3. Verify Firebase project configuration
4. Check Android/iOS permissions are granted
