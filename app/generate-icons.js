#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎨 Generating PWA icons...');

// Create a simple SVG icon for JobPool
const createIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size/8}" fill="#3b82f6"/>
  <rect x="${size*0.2}" y="${size*0.2}" width="${size*0.6}" height="${size*0.6}" rx="${size*0.1}" fill="white"/>
  <circle cx="${size*0.35}" cy="${size*0.35}" r="${size*0.08}" fill="#3b82f6"/>
  <circle cx="${size*0.65}" cy="${size*0.35}" r="${size*0.08}" fill="#3b82f6"/>
  <circle cx="${size*0.5}" cy="${size*0.6}" r="${size*0.1}" fill="#3b82f6"/>
  <path d="M${size*0.3} ${size*0.7} Q${size*0.5} ${size*0.8} ${size*0.7} ${size*0.7}" stroke="#3b82f6" stroke-width="${size*0.03}" fill="none"/>
</svg>`;
};

// Icon sizes needed for PWA
const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons
sizes.forEach(size => {
  const svgContent = createIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svgContent);
  console.log(`✅ Created ${filename}`);
});

// Create a simple favicon.ico placeholder
const faviconContent = createIcon(32);
fs.writeFileSync(path.join(__dirname, 'public', 'favicon.ico'), faviconContent);

// Create browserconfig.xml for Windows tiles
const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square150x150logo src="/icons/icon-144x144.svg"/>
            <TileColor>#3b82f6</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;

fs.writeFileSync(path.join(iconsDir, 'browserconfig.xml'), browserConfig);

// Create safari-pinned-tab.svg
const safariIcon = createIcon(16);
fs.writeFileSync(path.join(iconsDir, 'safari-pinned-tab.svg'), safariIcon);

console.log('🎉 PWA icons generated successfully!');
console.log('📝 Note: For production, replace these with high-quality PNG icons');
