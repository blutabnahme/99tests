const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  if (filePath.includes('node_modules') || filePath.includes('.next')) return;
  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // The true fix that catches ANY of the corrupted "removed dependency" comments:
  // Examples: 
  // // TODO: 99Tests - removed 99Tests dependency
  // //             <div ...
  content = content.replace(/\/\/ TODO: [^\n]+dependency\n\/\/\s?(.*)/g, '$1');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Reverted aggressive comments in: ${filePath}`);
  }
}

function traverse(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

console.log("Reverting broken JSX comments...");
['app', 'components', 'lib', 'scripts', 'messages'].forEach(d => {
   traverse(path.join(process.cwd(), d));
});
console.log("Done.");
