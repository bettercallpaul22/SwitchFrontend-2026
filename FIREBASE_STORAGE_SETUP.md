# Firebase Storage Configuration Guide

## 🔒 Important: Set Up Firebase Storage Rules

**The upload error occurs because Firebase Storage Security Rules are not configured.** By default, Firebase denies all uploads.

## Step 1: Update Firebase Storage Rules

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Storage** → **Rules** tab
4. Replace the rules with:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read/write their own documents
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

5. Click **Publish**

## Step 2: Verify User Authentication

Make sure the user is properly authenticated before attempting uploads. The error suggests `userId` might be empty.

### In DriverProfileSetupScreen:

```typescript
// Before showing upload inputs, ensure userId exists
{!driverUser?.id ? (
  <Text style={styles.waitingText}>
    Please complete authentication first
  </Text>
) : (
  <ImagePickerInput
    label="Driver's License Photo"
    userId={driverUser.id}  // Must not be empty!
    bucketType="DRIVER_LICENSES"
    onImageSelected={(url) => {...}}
  />
)}
```

## Step 3: Check Security Rules in Firebase Console

1. Open Firebase Console
2. Go to Storage
3. Click "Rules" tab
4. You should see the rules you published
5. Status should show "Published"

## Common Issues & Solutions

### Issue: "No object exists at the desired reference"
**Cause:** Firebase Storage Rules deny the upload
**Solution:** Ensure rules are published correctly (Step 1)

### Issue: "User is not authenticated"
**Cause:** User is not logged in when trying to upload
**Solution:** Check `driverUser?.id` is not empty (Step 2)

### Issue: "Storage bucket not found"
**Cause:** Firebase hasn't initialized Storage
**Solution:** Go to Firebase Console → Storage and create a bucket

### Issue: Upload works on Android but not iOS
**Cause:** iOS permissions not granted
**Solution:** Check Xcode → Info.plist has camera/photo library permissions

## Testing the Upload

1. **Ensure user is logged in:**
   - Check browser console: `localStorage.getItem('firebase:authUser:...')`
   - Or check Firebase Console → Authentication → Users

2. **Verify Firebase Storage initialized:**
   - Go to Firebase Console → Storage
   - Bucket should exist (e.g., `yourapp.appspot.com`)

3. **Test upload in console:**
   ```javascript
   // In Firebase Console
   const storage = firebase.storage();
   const ref = storage.ref(`driver-documents/${userId}/test.jpg`);
   // Try to upload a file
   ```

4. **Check browser console for logs:**
   - Look for `[ImageUploadService]` logs
   - Should see: `Storage path generated`, `Upload progress`, `Download URL obtained`

## Firebase Console Navigation

```
Firebase Console
  ↓
Select Project
  ↓
Left Sidebar → Storage
  ↓
Click "Rules" tab
  ↓
Paste rules above
  ↓
Click "Publish"
```

## Troubleshooting Checklist

- [ ] Firebase Storage Rules are published
- [ ] User is authenticated
- [ ] `driverUser?.id` is not empty
- [ ] Firebase Storage bucket exists
- [ ] iOS/Android permissions granted
- [ ] Running `npm start` after rules change

---

## Rules Explanation

```javascript
// Match any file under driver-documents/{userId}/* 
match /driver-documents/{userId}/{allPaths=**} {
  // Only allow if authenticated user's ID matches the path ID
  allow read, write: if request.auth.uid == userId;
}
```

This means:
- User can only access files at paths matching their own user ID
- User cannot access other users' documents
- Anonymous users cannot upload (requires authentication)

---

## Next Steps After Setup

1. Restart the app: `npm start`
2. Try uploading a document
3. Check Firebase Console → Storage to verify files appear
4. Check browser console for detailed logs

If still failing, share the console logs and we can debug further.
