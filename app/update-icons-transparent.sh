#!/bin/bash

# Script to update all app icons and favicons with transparent background logo
# Usage: ./update-icons-transparent.sh [path-to-your-icon.png]
#   - With no args: uses public/images/jobpool-logo.png
#   - With path: uses your PNG file (512x512 or 1024x1024 recommended)
# Run from app/ directory: cd app && ./update-icons-transparent.sh path/to/new-icon.png

LOGO_SOURCE="${1:-public/images/jobpool-logo.png}"
TEMP_DIR="/tmp/jobpool-icons-$$"
mkdir -p "$TEMP_DIR"

if [ ! -f "$LOGO_SOURCE" ]; then
    echo "❌ Error: Icon file not found: $LOGO_SOURCE"
    echo "   Place your new icon (PNG, 512x512 or 1024x1024) and run:"
    echo "   ./update-icons-transparent.sh path/to/your-icon.png"
    exit 1
fi

echo "📂 Using icon: $LOGO_SOURCE"
echo "🔄 Updating icons..."

# Function to resize and copy icon
resize_icon() {
    local size=$1
    local output=$2
    echo "  Creating ${size}x${size} icon..."
    sips -z $size $size "$LOGO_SOURCE" --out "$output" 2>/dev/null
}

# Create favicon sizes
echo "📱 Creating favicon sizes..."
resize_icon 16 "$TEMP_DIR/favicon-16.png"
resize_icon 32 "$TEMP_DIR/favicon-32.png"
resize_icon 192 "$TEMP_DIR/favicon-192.png"
resize_icon 512 "$TEMP_DIR/favicon-512.png"

# Copy to public/icons
echo "📁 Updating public icons..."
cp "$TEMP_DIR/favicon-16.png" public/icons/icon-16x16.png
cp "$TEMP_DIR/favicon-32.png" public/icons/icon-32x32.png
cp "$TEMP_DIR/favicon-192.png" public/icons/icon-192x192.png
cp "$TEMP_DIR/favicon-192.png" public/icons/icon-192x192-real.png
cp "$TEMP_DIR/favicon-512.png" public/icons/icon-512x512.png
cp "$TEMP_DIR/favicon-512.png" public/icons/icon-512x512-real.png

# Update favicon.ico (convert 32x32 to ico)
echo "🌐 Updating favicon.ico..."
sips -s format ico "$TEMP_DIR/favicon-32.png" --out src/app/favicon.ico 2>/dev/null || cp "$TEMP_DIR/favicon-32.png" src/app/favicon.ico

# iOS App Icons (skip if ios folder doesn't exist)
IOS_ICON_DIR="ios/App/App/Assets.xcassets/AppIcon.appiconset"
if [ -d "$IOS_ICON_DIR" ]; then
    echo "🍎 Updating iOS app icons..."
    resize_icon 1024 "$IOS_ICON_DIR/AppIcon-512@2x.png"
fi

# Android App Icons (all mipmap sizes) - compatible with bash 3.x (macOS default)
echo "🤖 Updating Android app icons..."
ANDROID_RES="android/app/src/main/res"

# folder:size pairs for Android mipmap densities
for pair in "mipmap-mdpi:48" "mipmap-hdpi:72" "mipmap-xhdpi:96" "mipmap-xxhdpi:144" "mipmap-xxxhdpi:192"; do
    folder="${pair%%:*}"
    size="${pair##*:}"
    echo "  Creating $folder icons (${size}x${size})..."
    resize_icon $size "$TEMP_DIR/android-${size}.png"
    cp "$TEMP_DIR/android-${size}.png" "$ANDROID_RES/$folder/ic_launcher.png"
    cp "$TEMP_DIR/android-${size}.png" "$ANDROID_RES/$folder/ic_launcher_round.png"
    cp "$TEMP_DIR/android-${size}.png" "$ANDROID_RES/$folder/ic_launcher_foreground.png"
done

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ All icons updated with transparent background!"
echo ""
echo "⚠️  Note: If the logo source doesn't have a transparent background,"
echo "   you'll need to remove it first using an image editor or tool like:"
echo "   - Online: remove.bg, photopea.com"
echo "   - macOS: Preview.app (Instant Alpha tool)"
echo "   - Command line: install 'rembg' (pip install rembg-cli)"

