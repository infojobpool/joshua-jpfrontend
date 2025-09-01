const fs = require('fs');
const path = require('path');

// Ignore common system/build folders and hidden files
const ignored = new Set([
  'node_modules', '.next', '.git', '.vscode', 'dist', '.DS_Store',
]);

function printStructure(dir, prefix = '') {
  let files = fs.readdirSync(dir).filter(f => !ignored.has(f) && !f.startsWith('.'));
  files.sort();

  files.forEach((file, index) => {
    const fullPath = path.join(dir, file);
    const isLast = index === files.length - 1;
    const stats = fs.statSync(fullPath);

    const connector = isLast ? '└── ' : '├── ';
    console.log(prefix + connector + file);

    if (stats.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      printStructure(fullPath, newPrefix);
    }
  });
}

const rootDir = process.argv[2] || '.';
console.log(`📂 Folder Structure of: ${path.resolve(rootDir)}\n`);
printStructure(rootDir);
