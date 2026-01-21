#!/usr/bin/env python3
"""
Update favicons to use the exact same logo as the website
No backgrounds, no modifications - just resize the logo
"""

from PIL import Image
import os

def main():
    logo_source = "public/images/jobpool-logo.png"
    
    if not os.path.exists(logo_source):
        print(f"❌ Error: Logo source not found: {logo_source}")
        return
    
    print("🎨 Updating favicons to match website logo exactly...")
    
    # Load source logo
    source = Image.open(logo_source).convert('RGBA')
    
    # Process favicon sizes - just resize, no backgrounds
    favicon_sizes = [16, 32, 192, 512]
    
    for size in favicon_sizes:
        print(f"  Processing {size}x{size}...")
        
        # Simply resize the logo - no background, no padding
        favicon = source.resize((size, size), Image.Resampling.LANCZOS)
        
        # Save
        output_path = f"public/icons/icon-{size}x{size}.png"
        favicon.save(output_path, "PNG", optimize=True)
        print(f"    ✅ Saved {output_path}")
        
        # Also update the -real versions
        if size in [192, 512]:
            real_path = f"public/icons/icon-{size}x{size}-real.png"
            favicon.save(real_path, "PNG", optimize=True)
    
    # Update favicon.ico (use 32x32 version)
    print("  Creating favicon.ico...")
    favicon_32 = source.resize((32, 32), Image.Resampling.LANCZOS)
    
    # Convert to ICO format
    try:
        # Save as PNG first, then convert
        temp_png = "/tmp/favicon-32-temp.png"
        favicon_32.save(temp_png, "PNG")
        os.system(f"sips -s format ico {temp_png} --out src/app/favicon.ico 2>/dev/null")
        if os.path.exists("src/app/favicon.ico"):
            print("    ✅ Saved favicon.ico")
        else:
            # Fallback: copy PNG
            favicon_32.save("src/app/favicon.ico", "PNG")
            print("    ✅ Saved favicon.ico (as PNG)")
    except Exception as e:
        print(f"    ⚠️  Error creating ICO: {e}")
        favicon_32.save("src/app/favicon.ico", "PNG")
    
    print()
    print("✅ Favicons updated to match website logo exactly!")
    print("   - No backgrounds added")
    print("   - No modifications - just resized logo")
    print("   - Same transparent logo as used on website")

if __name__ == "__main__":
    main()

