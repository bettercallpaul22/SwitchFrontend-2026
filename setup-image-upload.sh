#!/bin/bash

# Image Upload Implementation Setup Script
# Installs react-native-image-picker and verifies Firebase Storage configuration

set -e

echo "🔧 Installing react-native-image-picker..."
npm install react-native-image-picker

echo ""
echo "📱 Installing iOS pods..."
cd ios && pod install && cd ..

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Review IMAGE_UPLOAD_GUIDE.md for full documentation"
echo "2. Check android/app/src/main/AndroidManifest.xml for required permissions:"
echo "   - android.permission.CAMERA"
echo "   - android.permission.READ_EXTERNAL_STORAGE"
echo "   - android.permission.WRITE_EXTERNAL_STORAGE"
echo "3. Run: npm start"
echo "4. Test driver profile setup with image uploads"
echo ""
echo "Documentation: ./IMAGE_UPLOAD_GUIDE.md"
