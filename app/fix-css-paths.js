const fs = require('fs');
const path = require('path');

// Read the index.html file
const indexPath = path.join(__dirname, 'out', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Replace absolute CSS paths with relative paths
html = html.replace(/href="\/_next\/static\/css\//g, 'href="./_next/static/css/');
html = html.replace(/src="\/_next\/static\//g, 'src="./_next/static/');
html = html.replace(/href="\/_next\/static\//g, 'href="./_next/static/');

// Write the fixed HTML back
fs.writeFileSync(indexPath, html);

console.log('Fixed CSS paths in index.html');
