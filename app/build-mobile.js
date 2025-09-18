const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building JobPool for mobile deployment...');

// Step 1: Build the Next.js app
console.log('📦 Building Next.js app...');
execSync('npm run build', { stdio: 'inherit' });

// Step 2: Create static export for mobile
console.log('📱 Creating static export for mobile...');
execSync('npx next export', { stdio: 'inherit' });

// Step 3: Copy static files to out directory
console.log('📂 Preparing mobile assets...');
const outDir = path.join(__dirname, 'out');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Copy the static export to out directory
execSync('cp -r out/* out/', { stdio: 'inherit' });

console.log('✅ Mobile build complete!');
console.log('📱 Next steps:');
console.log('1. Run: npx cap sync');
console.log('2. Run: npx cap open android (for Android)');
console.log('3. Run: npx cap open ios (for iOS)');