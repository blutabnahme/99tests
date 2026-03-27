const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  if (filePath.includes('node_modules') || filePath.includes('.next')) return;
  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Fix patterns like `recommendation "value":`, `recommendation 'value':`, `recommendation varName:`, `recommendation 0:`
  content = content.replace(/(\s+)recommendation(\s+['"`A-Za-z0-9_.-]+)(\s*:)/g, '$1case$2$3');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed switch case in: ${filePath}`);
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

console.log("Fixing switch-case breakage...");
['app', 'components', 'lib', 'scripts', 'messages'].forEach(d => {
   traverse(path.join(process.cwd(), d));
});
console.log("Done.");
