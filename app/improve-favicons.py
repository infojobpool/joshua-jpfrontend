#!/usr/bin/env python3
"""
Improve favicon clarity for small sizes (16x16, 32x32)
- Add subtle background for better visibility
- Enhance contrast and sharpness
- Add padding to prevent edge clipping
- Optimize for small icon display
"""

from PIL import Image, ImageEnhance, ImageFilter
import os

def create_clear_favicon(source_img, size, add_background=True):
    """Create a clear, visible favicon optimized for small sizes"""
    
    # For very small sizes, add padding and background
    if size <= 32:
        # Create a new image with padding (10% padding)
        padding = int(size * 0.1)
        canvas_size = size
        logo_size = size - (padding * 2)
        
        # Resize logo to fit in padded area
        logo = source_img.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
        
        # Create canvas
        if add_background:
            # Use a subtle blue background that matches the theme
            # Light blue background: #e0f2fe (rgb(224, 242, 254))
            canvas = Image.new('RGBA', (canvas_size, canvas_size), (224, 242, 254, 255))
        else:
            canvas = Image.new('RGBA', (canvas_size, canvas_size), (255, 255, 255, 0))
        
        # Paste logo in center with padding
        canvas.paste(logo, (padding, padding), logo if logo.mode == 'RGBA' else None)
        
        # Enhance contrast for small sizes
        enhancer = ImageEnhance.Contrast(canvas)
        canvas = enhancer.enhance(1.2)  # 20% more contrast
        
        # Sharpen for clarity
        canvas = canvas.filter(ImageFilter.SHARPEN)
        
        return canvas
    else:
        # For larger sizes, just resize with high quality
        img = source_img.resize((size, size), Image.Resampling.LANCZOS)
        
        # Slight contrast enhancement
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.1)
        
        return img

def main():
    logo_source = "public/images/jobpool-logo.png"
    
    if not os.path.exists(logo_source):
        print(f"❌ Error: Logo source not found: {logo_source}")
        return
    
    print("🎨 Improving favicon clarity for small sizes...")
    
    # Load source logo
    source = Image.open(logo_source).convert('RGBA')
    
    # Process favicon sizes
    favicon_sizes = [16, 32, 192, 512]
    
    for size in favicon_sizes:
        print(f"  Processing {size}x{size}...")
        
        # For small sizes (16, 32), add background and padding
        add_bg = size <= 32
        favicon = create_clear_favicon(source, size, add_background=add_bg)
        
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
    favicon_32 = create_clear_favicon(source, 32, add_background=True)
    
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
    print("✅ Favicon clarity improvements complete!")
    print("   - Small favicons (16x16, 32x32) now have:")
    print("     • Subtle blue background for better visibility")
    print("     • Enhanced contrast and sharpness")
    print("     • Padding to prevent edge clipping")

if __name__ == "__main__":
    main()

