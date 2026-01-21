#!/usr/bin/env python3
"""
Process JobPool logo to remove background and align colors with landing page theme.
Landing page uses: #0a2463 (dark blue), #3b82f6 (blue-600), blue gradients
"""

from PIL import Image
import os
import sys

# Landing page color theme
LANDING_COLORS = {
    'primary': '#0a2463',      # Dark blue for headings
    'accent': '#3b82f6',        # Blue-600 for buttons
    'gradient_start': '#1e40af', # Blue-800
    'gradient_end': '#3b82f6',   # Blue-600
}

def remove_background_simple(img):
    """Remove white/light background from logo"""
    img = img.convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # If pixel is white/light (high brightness), make it transparent
        r, g, b, a = item
        brightness = (r + g + b) / 3
        
        # Threshold: if brightness > 240, make transparent
        # Also check if it's close to white (all channels high)
        if brightness > 240 or (r > 240 and g > 240 and b > 240):
            new_data.append((255, 255, 255, 0))  # Transparent
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    return img

def enhance_colors_to_theme(img):
    """Enhance logo colors to match landing page blue theme
    Landing page uses: #0a2463 (dark blue), #2563eb (blue-600), #3b82f6 (light blue)
    Directly maps logo colors to landing page color palette
    """
    img = img.convert("RGBA")
    data = img.getdata()
    
    # Landing page colors
    LANDING_DARK = (10, 36, 99)      # #0a2463 - Primary heading
    LANDING_MEDIUM = (37, 99, 235)   # #2563eb - Buttons (blue-600)
    LANDING_LIGHT = (59, 130, 246)   # #3b82f6 - Accent
    
    new_data = []
    for item in data:
        r, g, b, a = item
        
        # Skip transparent pixels
        if a == 0:
            new_data.append(item)
            continue
        
        brightness = (r + g + b) / 3
        
        # Map based on brightness to landing page colors
        if brightness < 60:  # Very dark -> dark blue
            new_data.append((LANDING_DARK[0], LANDING_DARK[1], LANDING_DARK[2], a))
        elif brightness < 120:  # Medium dark -> blend dark and medium
            factor = (brightness - 60) / 60
            r = int(LANDING_DARK[0] * (1 - factor) + LANDING_MEDIUM[0] * factor)
            g = int(LANDING_DARK[1] * (1 - factor) + LANDING_MEDIUM[1] * factor)
            b = int(LANDING_DARK[2] * (1 - factor) + LANDING_MEDIUM[2] * factor)
            new_data.append((r, g, b, a))
        elif brightness < 180:  # Medium -> blend medium and light
            factor = (brightness - 120) / 60
            r = int(LANDING_MEDIUM[0] * (1 - factor) + LANDING_LIGHT[0] * factor)
            g = int(LANDING_MEDIUM[1] * (1 - factor) + LANDING_LIGHT[1] * factor)
            b = int(LANDING_MEDIUM[2] * (1 - factor) + LANDING_LIGHT[2] * factor)
            new_data.append((r, g, b, a))
        else:  # Light pixels -> keep but enhance blue
            r = min(255, int(r * 0.8))
            g = min(255, int(g * 0.85))
            b = min(255, int(b * 1.2))
            new_data.append((r, g, b, a))
    
    img.putdata(new_data)
    return img

def process_logo(input_path, output_path, size=None):
    """Process logo: remove background and enhance colors"""
    print(f"  Processing: {input_path} -> {output_path}")
    
    # Open image
    img = Image.open(input_path)
    
    # Resize if needed
    if size:
        img = img.resize((size, size), Image.Resampling.LANCZOS)
    
    # Remove background
    img = remove_background_simple(img)
    
    # Enhance colors to match theme
    img = enhance_colors_to_theme(img)
    
    # Save as PNG (supports transparency)
    img.save(output_path, "PNG", optimize=True)
    print(f"    ✅ Saved {size}x{size if size else img.size[0]} icon")

def main():
    logo_source = "public/images/jobpool-logo.png"
    
    if not os.path.exists(logo_source):
        print(f"❌ Error: Logo source not found: {logo_source}")
        sys.exit(1)
    
    print("🎨 Processing JobPool logo with transparent background and theme colors...")
    print(f"   Source: {logo_source}")
    print()
    
    # Create temp directory
    temp_dir = "/tmp/jobpool-icons-processed"
    os.makedirs(temp_dir, exist_ok=True)
    
    # Process favicon sizes
    print("📱 Creating favicon sizes...")
    sizes = [16, 32, 192, 512]
    for size in sizes:
        output = f"{temp_dir}/icon-{size}x{size}.png"
        process_logo(logo_source, output, size)
    
    # Copy to public/icons
    print()
    print("📁 Updating public icons...")
    os.makedirs("public/icons", exist_ok=True)
    os.system(f"cp {temp_dir}/icon-16x16.png public/icons/icon-16x16.png")
    os.system(f"cp {temp_dir}/icon-32x32.png public/icons/icon-32x32.png")
    os.system(f"cp {temp_dir}/icon-192x192.png public/icons/icon-192x192.png")
    os.system(f"cp {temp_dir}/icon-192x192.png public/icons/icon-192x192-real.png")
    os.system(f"cp {temp_dir}/icon-512x512.png public/icons/icon-512x512.png")
    os.system(f"cp {temp_dir}/icon-512x512.png public/icons/icon-512x512-real.png")
    
    # Update favicon.ico (use 32x32)
    print()
    print("🌐 Updating favicon.ico...")
    # Convert PNG to ICO using sips (macOS)
    os.system(f"sips -s format ico {temp_dir}/icon-32x32.png --out src/app/favicon.ico 2>/dev/null || cp {temp_dir}/icon-32x32.png src/app/favicon.ico")
    
    # iOS App Icons
    print()
    print("🍎 Updating iOS app icons...")
    ios_dir = "ios/App/App/Assets.xcassets/AppIcon.appiconset"
    os.makedirs(ios_dir, exist_ok=True)
    process_logo(logo_source, f"{ios_dir}/AppIcon-512@2x.png", 1024)
    
    # Android App Icons
    print()
    print("🤖 Updating Android app icons...")
    android_res = "android/app/src/main/res"
    android_sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    
    for folder, size in android_sizes.items():
        folder_path = f"{android_res}/{folder}"
        os.makedirs(folder_path, exist_ok=True)
        output = f"{temp_dir}/android-{size}.png"
        process_logo(logo_source, output, size)
        os.system(f"cp {output} {folder_path}/ic_launcher.png")
        os.system(f"cp {output} {folder_path}/ic_launcher_round.png")
        os.system(f"cp {output} {folder_path}/ic_launcher_foreground.png")
    
    # Cleanup
    print()
    print("🧹 Cleaning up...")
    os.system(f"rm -rf {temp_dir}")
    
    print()
    print("✅ All icons updated with transparent background and theme colors!")
    print("   Colors aligned with landing page: #0a2463 (dark blue), #3b82f6 (blue-600)")

if __name__ == "__main__":
    main()

