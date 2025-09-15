#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Next.js app for mobile...');

// Step 1: Build the Next.js app
console.log('📦 Building Next.js app...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Next.js build completed');
} catch (error) {
  console.error('❌ Next.js build failed:', error.message);
  process.exit(1);
}

// Step 2: Copy static files to the correct directory for Capacitor
console.log('📁 Preparing files for Capacitor...');

const sourceDir = path.join(__dirname, '.next');
const targetDir = path.join(__dirname, 'out');

// Create out directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy static files
try {
  execSync(`cp -r ${sourceDir}/static ${targetDir}/`);
  execSync(`cp -r ${sourceDir}/server ${targetDir}/`);
  
  // Create a basic index.html for Capacitor
  const indexHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>JobPool</title>
  <script>
    // Redirect to the Next.js app
    window.location.href = '/dashboard';
  </script>
</head>
<body>
  <div>Loading JobPool...</div>
</body>
</html>`;
  
  fs.writeFileSync(path.join(targetDir, 'index.html'), indexHtml);
  
  console.log('✅ Files prepared for Capacitor');
} catch (error) {
  console.error('❌ Failed to prepare files:', error.message);
  process.exit(1);
}

console.log('🎉 Mobile build completed successfully!');
console.log('📱 You can now run: npx cap sync');
